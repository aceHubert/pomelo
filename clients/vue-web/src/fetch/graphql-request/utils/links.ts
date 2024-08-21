import { HttpLink, Observable, type UriFunction } from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';
import { createUploadLink } from 'apollo-upload-client';
import { createClient } from 'graphql-ws';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { onError } from '@apollo/client/link/error';
import { absoluteGo } from '@ace-util/core';
import { createUploadFetch, isServerError, isServerParseError } from '@ace-pomelo/shared-client';
import { auth } from '@/auth';
import { i18n } from '@/i18n';

// http link
export const createHttpLink = (uri: string | UriFunction) =>
  new HttpLink({
    uri,
    headers: {
      // https://www.apollographql.com/docs/apollo-server/security/cors/#preventing-cross-site-request-forgery-csrf
      'Apollo-Require-Preflight': 'true',
    },
    credentials: 'same-origin',
    // fetch,
  });

// http link with upload
export const createHttpUploadLink = (uri: string | UriFunction) =>
  createUploadLink({
    uri,
    headers: {
      // https://www.apollographql.com/docs/apollo-server/security/cors/#preventing-cross-site-request-forgery-csrf
      'Apollo-Require-Preflight': 'true',
    },
    credentials: 'same-origin',
    fetch: createUploadFetch(),
  });

// websocket link
export const createWebsocketLink = (url: string | (() => string | Promise<string>)) =>
  new GraphQLWsLink(
    createClient({
      url,
      retryAttempts: Infinity,
      shouldRetry: () => true,
      keepAlive: 10000,
      connectionParams: async () => {
        const token = await auth.userManager
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

// set Authorization header
export const authLink = setContext(async (operation, { headers, ...context }) => {
  const accessToken = await auth.userManager
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

// onErrer retry async refreshToken
const promiseToObservable = <T>(promise: Promise<T>, error?: (error: Error) => void) =>
  new Observable<T>((subscriber) => {
    promise.then((value) => {
      if (subscriber.closed) return;
      subscriber.next(value);
      subscriber.complete();
    }, error?.bind(subscriber) || subscriber.error.bind(subscriber));
  });

// error handle
export const errorLink = onError(({ networkError, graphQLErrors, operation, forward }) => {
  // 重试登录，refresh token 重新获取 access token，如果再不成功则退出重新登录
  const tryLogin = () => {
    return promiseToObservable(auth.userManager.signinSilent(), () => {
      auth.userManager.signin();
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
    } else if (graphQLErrors.some((err) => err.extensions?.siteInitRequired)) {
      // 需要初始化站点(graphql resolver执行中产生的错误)
      absoluteGo(process.env.BASE_URL + 'initialize');
      return;
    }
  }

  if (networkError) {
    if (isServerError(networkError) || isServerParseError(networkError)) {
      const statusCode = networkError.statusCode;
      if (statusCode === 401) {
        return tryLogin();
      } else if (
        statusCode === 500 &&
        isServerError(networkError) &&
        typeof networkError.result !== 'string' &&
        networkError.result.siteInitRequired
      ) {
        // 需要初始化站点(以 http code 返回，中间件优先于graphql resolver执行时产生的错误)
        absoluteGo(process.env.BASE_URL + 'initialize');
        return;
      }
    }
  }

  return;
});
