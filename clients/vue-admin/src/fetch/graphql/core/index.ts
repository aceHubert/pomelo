import {
  ApolloClient,
  // HttpLink,
  InMemoryCache,
  isApolloError,
  Observable,
  from,
  split,
  gql,
} from '@apollo/client/core';
import { getMainDefinition } from '@apollo/client/utilities';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { onError } from '@apollo/client/link/error';
import { createUploadLink } from 'apollo-upload-client';
import { createClient } from 'graphql-ws';
import { getEnv } from '@ace-util/core';
import { userManager } from '@/auth';
import { i18n } from '@/i18n';
import { loadingRef, errorRef, SharedError } from '@/shared';
import { Request, isServerError, isServerParseError } from './request';
import { customFetch } from './fetch';

// Types
import type { RegistApiDefinition, RegistApi } from './request';

// onErrer retry async refreshToken
const promiseToObservable = <T>(promise: Promise<T>, error?: (error: Error) => void) =>
  new Observable<T>((subscriber) => {
    promise.then((value) => {
      if (subscriber.closed) return;
      subscriber.next(value);
      subscriber.complete();
    }, error?.bind(subscriber) || subscriber.error.bind(subscriber));
  });

const uploadLink = createUploadLink({
  uri: getEnv('graphqlBase', '/graphql', (window as any)._ENV),
  headers: {
    // https://www.apollographql.com/docs/apollo-server/security/cors/#preventing-cross-site-request-forgery-csrf
    'Apollo-Require-Preflight': 'true',
  },
  credentials: 'same-origin',
  fetch: customFetch,
});

// set Authorization header
const authLink = setContext(async (operation, { headers, ...context }) => {
  const accessToken = await userManager
    .getUser()
    .then((user) => user?.access_token)
    .catch(() => '');
  const token = accessToken;
  const locale = i18n.locale;
  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(locale ? { 'x-custom-locale': locale } : {}),
    },
    ...context,
  };
});

// error handle
const errorLink = onError(({ networkError, graphQLErrors, operation, forward }) => {
  // 重试登录，refresh token 重新获取 access token，如果再不成功则退出重新登录
  const tryLogin = () => {
    return promiseToObservable(userManager.signinSilent(), () => {
      userManager.signin();
    }).flatMap((user) => {
      const headers = {
        ...operation.getContext().headers,
        Authorization: `Bearer ${user!.access_token}`,
      };
      operation.setContext({
        headers,
      });
      return forward(operation);
    });
  };

  if (graphQLErrors) {
    if (
      graphQLErrors.some(
        (err) => err.extensions?.code && (err.extensions.statusCode === 401 || err.extensions.code === 'UNAUTHORIZED'),
      )
    ) {
      return tryLogin();
    } else if (graphQLErrors.some((err) => err.extensions?.dbInitRequired)) {
      // 需要初始化数据库(graphql resolver执行中产生的错误)
      errorRef.value = new SharedError('表不存在，或需要初始化数据库！');
      return;
    }
  }

  if (networkError) {
    if (isServerError(networkError) || isServerParseError(networkError)) {
      const statusCode = networkError.statusCode;
      if (statusCode === 401) {
        return tryLogin();
      } else if (statusCode === 500) {
        // 需要初始化(以 http code 返回，中间件优先于graphql resolver执行时产生的错误)
        if (
          isServerError(networkError) &&
          typeof networkError.result !== 'string' &&
          networkError.result.dbInitRequired
        ) {
          errorRef.value = new SharedError('表不存在，或需要初始化数据库！');
        }
      }
    }
  }

  return;
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: getEnv('graphqlSubscriptionBase', `ws://${window.location.host}/graphql`, (window as any)._ENV),
    connectionParams: async () => {
      const token = await userManager
        .getUser()
        .then((user) => user?.access_token)
        .catch(() => '');

      return {
        token,
        lang: i18n.locale,
      };
    },
  }),
);

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
  },
  wsLink,
  from([errorLink, authLink, uploadLink]),
);

/**
 * apollo client
 */
export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    query: {
      fetchPolicy: 'no-cache',
    },
    mutate: {
      fetchPolicy: 'no-cache',
    },
    watchQuery: {
      fetchPolicy: 'no-cache',
    },
  },
  connectToDevTools: process.env.NODE_ENV === 'development',
});

// Request instance
export const request = new Request(client, {
  loading() {
    loadingRef.value = true;
    return () => {
      loadingRef.value = false;
    };
  },
  onCatch(err: any) {
    errorRef.value = new SharedError(err.message, err.code);
  },
});

const cache = new Map();
export const defineRegistApi = <C extends RegistApiDefinition>(id: string, define: C) => {
  function useRegistApi() {
    if (!cache.has(id)) {
      cache.set(id, request.regist(define));
    }
    return cache.get(id);
  }

  return useRegistApi as () => RegistApi<C>;
};

export { gql, isApolloError, isServerParseError };

export default client;
