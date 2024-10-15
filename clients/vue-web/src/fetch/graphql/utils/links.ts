import { HttpLink, Observable, type HttpOptions } from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';
import { createUploadLink } from 'apollo-upload-client';
import { createClient, type ClientOptions } from 'graphql-ws';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { onError } from '@apollo/client/link/error';
import { createUploadFetch } from '@ace-fetch/graphql';
import { isServerError, isServerParseError } from './helpers';

/**
 * Create http link
 */
export const createHttpLink = (uri: NonNullable<HttpOptions['uri']>, options?: Omit<HttpOptions, 'url'>) => {
  const { headers, ...rest } = options || {};
  return new HttpLink({
    uri,
    headers: {
      // https://www.apollographql.com/docs/apollo-server/security/cors/#preventing-cross-site-request-forgery-csrf
      'Apollo-Require-Preflight': 'true',
      ...headers,
    },
    credentials: 'same-origin',
    // fetch,
    ...rest,
  });
};

/**
 * Create http link with upload
 */
export const createHttpUploadLink = (uri: NonNullable<HttpOptions['uri']>, options?: Omit<HttpOptions, 'url'>) => {
  const { headers, fetch = createUploadFetch(), ...rest } = options || {};
  return createUploadLink({
    uri,
    headers: {
      // https://www.apollographql.com/docs/apollo-server/security/cors/#preventing-cross-site-request-forgery-csrf
      'Apollo-Require-Preflight': 'true',
      ...headers,
    },
    credentials: 'same-origin',
    fetch,
    ...rest,
  });
};

/**
 * Create websocket link
 */
export const createWebsocketLink = (url: ClientOptions['url'], options?: Omit<ClientOptions, 'url'>) =>
  new GraphQLWsLink(
    createClient({
      url,
      retryAttempts: Infinity,
      shouldRetry: () => true,
      keepAlive: 10000,
      ...options,
    }),
  );

/**
 * Set Authorization header
 * @param customHeaders headers to request
 */
export const setHeaders = (customHeaders: Record<string, any> | (() => Promise<Record<string, any>>)) =>
  setContext(async (operation, { headers, ...context }) => {
    return {
      headers: {
        ...headers,
        ...(typeof customHeaders === 'function' ? await customHeaders() : customHeaders),
      },
      ...context,
    };
  });

/**
 * Promise to Observable
 */
const promiseToObservable = <T>(promise: () => Promise<T>, reject?: (error: Error) => void | PromiseLike<void>) =>
  new Observable<T>((subscriber) => {
    promise().then((value) => {
      if (subscriber.closed) return;
      subscriber.next(value);
      subscriber.complete();
    }, reject?.bind(subscriber) || subscriber.error.bind(subscriber));
  });

/**
 * Error handler
 * @param options options
 * @param option.unauthHandler to login page
 * @param options.retry get Authorization header
 * @param options.initialize to initialize site
 */
export const errorHandler = (options: {
  unauthHandler: () => Promise<void>;
  retry?: () => Promise<Record<string, any>>;
  initialize?: () => Promise<void> | void;
}) =>
  onError(({ networkError, graphQLErrors, operation, forward }) => {
    // 重试登录，refresh token 重新获取 access token，如果再不成功则退出重新登录
    const tryLogin = () => {
      if (options.retry) {
        return promiseToObservable(options.retry, options.unauthHandler).flatMap((customHeaders) => {
          operation.setContext({
            headers: {
              ...operation.getContext().headers,
              ...customHeaders,
            },
          });
          return forward(operation);
        });
      } else {
        options.unauthHandler();
        return;
      }
    };

    if (graphQLErrors) {
      if (
        graphQLErrors.some(
          (err) =>
            err.extensions?.code && (err.extensions.statusCode === 401 || err.extensions.code === 'UNAUTHORIZED'),
        )
      ) {
        return tryLogin();
      } else if (graphQLErrors.some((err) => err.extensions?.siteInitRequired)) {
        // 需要初始化站点(graphql resolver执行中产生的错误)
        options.initialize?.();
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
          options.initialize?.();
          return;
        }
      }
    }

    return;
  });
