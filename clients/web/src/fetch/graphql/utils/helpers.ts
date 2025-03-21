import { hasIn } from 'lodash-es';
import { isApolloError, type ServerError, type ServerParseError } from '@apollo/client/core';
import { GraphQLInnerError } from '@ace-fetch/graphql';
import codes from './codes.json';

/**
 * 是否是 Server error
 * 如果是 ApolloError，则会判断err.networkError
 */
export function isServerError(err: Error): err is ServerError {
  return isApolloError(err)
    ? !!(err.networkError && hasIn(err.networkError, 'statusCode')) && hasIn(err.networkError, 'result')
    : hasIn(err, 'statusCode') && hasIn(err, 'result');
}

/**
 * 是否是 Server parse error
 */
export function isServerParseError(err: Error): err is ServerParseError {
  return isApolloError(err)
    ? !!(err.networkError && hasIn(err.networkError, 'statusCode')) && hasIn(err.networkError, 'bodyText')
    : hasIn(err, 'statusCode') && hasIn(err, 'bodyText');
}

export class GraphQLFormattedError extends Error {
  readonly code: number;
  readonly originalError?: unknown;

  constructor(message: string, code: number, originalError?: unknown) {
    super(message);
    Object.setPrototypeOf(this, GraphQLFormattedError.prototype);
    this.name = 'GraphQLFormattedError';
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * 从error 中生成 code 和 message
 * code 在 networkError 中将会是 error.[statusCode], graphQLErrors 中将会是第一条 error.[extensions.code], fallbace: code.500
 * @param err Error
 */
export function formatError(err: Error) {
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
      return new GraphQLFormattedError(
        graphQLErrors.length === 1
          ? graphQLErrors[0].message || err.message
          : `Errors: ${graphQLErrors
              .map((graphQLError) => graphQLError?.message)
              .filter(Boolean)
              .join('; ')}`,
        extensions ? extensions.statusCode || (extensions?.code && codes[extensions?.code]) || 500 : 500,
        err,
      );
    } else if (networkError && isServerError(networkError)) {
      return new GraphQLFormattedError(networkError.message, networkError.statusCode, err);
    }
  } else if (err instanceof GraphQLInnerError) {
    const graphQLErrors = err.graphQLErrors;
    // 第一要包含code的详细信息
    const extensions = graphQLErrors.find((error) => error.extensions?.code)?.extensions;
    return new GraphQLFormattedError(
      graphQLErrors.length === 1
        ? graphQLErrors[0].message || err.message
        : `Errors: ${graphQLErrors
            .map((graphQLError) => graphQLError?.message)
            .filter(Boolean)
            .join('; ')}`,
      extensions ? extensions.statusCode || (extensions?.code && codes[extensions?.code as string]) || 500 : 500,
      err,
    );
  }
  return new GraphQLFormattedError(err.message, 500, err);
}
