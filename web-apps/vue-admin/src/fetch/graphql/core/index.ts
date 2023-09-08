import {
  ApolloClient,
  HttpLink,
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
import { createClient } from 'graphql-ws';
import { hasIn } from 'lodash-es';
import { getEnv } from '@ace-util/core';
import { userManager } from '@/auth';
import { i18n } from '@/i18n';
import { loadingRef, errorRef, SharedError } from '@/shared';
import { Request } from './request';

// Types
import type { ServerError, ServerParseError } from '@apollo/client/core';
import type { RegistApiDefinition, RegistApi } from './request';

/**
 * 是否是 Server error
 * 如果是 ApolloError，则会判断err.networkError
 */
function isServerError(err: Error): err is ServerError {
  return isApolloError(err)
    ? !!(err.networkError && hasIn(err.networkError, 'statusCode')) && hasIn(err.networkError, 'result')
    : hasIn(err, 'statusCode') && hasIn(err, 'result');
}

function isServerParseError(err: Error): err is ServerParseError {
  return isApolloError(err)
    ? !!(err.networkError && hasIn(err.networkError, 'statusCode')) && hasIn(err.networkError, 'bodyText')
    : hasIn(err, 'statusCode') && hasIn(err, 'bodyText');
}

// graphql error code 对应 http code 关系
const GraphqlErrorCodes: Dictionary<number> = {
  BAD_USER_INPUT: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  VALIDATION_FAILED: 405,
  INTERNAL_SERVER_ERROR: 500,
  // 其它错误当成 500 处理
};

/**
 * 从error 中生成 code 和 message
 * code 在 networkError 中将会是 error.[statusCode], graphQLErrors 中将会是第一条 error.[extensions.code], fallbace: code.500
 * @param err Error
 */
function formatError(err: Error) {
  if (isApolloError(err)) {
    let graphQLErrors = err.graphQLErrors;
    const networkError = err.networkError;
    // https://www.apollographql.com/docs/react/api/link/apollo-link-error/#:~:text=An%20error%20is%20passed%20as%20a%20networkError%20if,the%20case%20of%20a%20failing%20HTTP%20status%20code.
    if (
      !graphQLErrors?.length &&
      networkError &&
      isServerError(networkError) &&
      typeof networkError.result !== 'string' &&
      networkError.result.errors
    ) {
      graphQLErrors = networkError.result.errors;
    }

    if (Array.isArray(graphQLErrors) && graphQLErrors.length) {
      // 第一要包含code的详细信息
      const extensions = graphQLErrors.find((error) => error.extensions?.code)?.extensions;
      return {
        statusCode: extensions ? extensions.statusCode || GraphqlErrorCodes[extensions.code] || 500 : 500,
        message: graphQLErrors
          .map((graphQLError) => graphQLError?.message)
          .filter(Boolean)
          .join('; '),
      };
    } else if (networkError && isServerError(networkError)) {
      return {
        statusCode: networkError.statusCode,
        message: networkError.message,
      };
    }
  }
  return {
    statusCode: 500,
    message: err.message,
  };
}

// onErrer retry async refreshToken
const promiseToObservable = <T>(promise: Promise<T>, error?: (error: Error) => void) =>
  new Observable<T>((subscriber) => {
    promise.then((value) => {
      if (subscriber.closed) return;
      subscriber.next(value);
      subscriber.complete();
    }, error?.bind(subscriber) || subscriber.error.bind(subscriber));
  });

const httpLink = new HttpLink({
  uri: getEnv('graphqlBase', '/graphql', (window as any)._ENV),
  // headers: {},
  // credentials: '',
  // fetch,
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
        (err) =>
          err.extensions?.code &&
          (err.extensions.statusCode || GraphqlErrorCodes[err.extensions.code as string]) === 401,
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
  from([errorLink, authLink, httpLink]),
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

// 注册 schema
export const request = new Request(client, {
  loading() {
    loadingRef.value = true;
    return () => {
      loadingRef.value = false;
    };
  },
  onCatch(err) {
    const { message, statusCode } = formatError(err);
    errorRef.value = new SharedError(message, statusCode);
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

export { gql, formatError, isApolloError, isServerParseError };

export default client;
