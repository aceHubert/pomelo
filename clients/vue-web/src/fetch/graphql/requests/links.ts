import { HttpLink, Observable, type UriFunction } from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';
import { createClient } from 'graphql-ws';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { onError } from '@apollo/client/link/error';
import { userManager } from '@/auth';
import { i18n } from '@/i18n';
import { errorRef, SharedError } from '@/shared';
import { isServerError, isServerParseError } from '../request';

// http link
export const httpLink = (uri: string | UriFunction) =>
  new HttpLink({
    uri,
    // headers: {},
    // credentials: '',
    // fetch,
  });

// websocket link
export const wsLink = (url: string) =>
  new GraphQLWsLink(
    createClient({
      url,
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

// set Authorization header
export const authLink = setContext(async (operation, { headers, ...context }) => {
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
