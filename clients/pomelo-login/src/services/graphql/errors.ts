import { ApolloError } from '@apollo/client';

type GraphqlErrorExtensions = {
  code?: unknown;
  statusCode?: unknown;
  response?: {
    statusCode?: unknown;
  };
};

const graphqlCodeStatusMap: Record<string, number> = {
  UNAUTHORIZED: 401,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  INTERNAL_SERVER_ERROR: 500,
};

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

function normalizeStatusCode(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return Number(value);
  }

  return;
}

export function resolveGraphqlErrorStatusCode(extensions?: GraphqlErrorExtensions) {
  if (!extensions) return;

  return (
    normalizeStatusCode(extensions.statusCode) ||
    normalizeStatusCode(extensions.response?.statusCode) ||
    normalizeStatusCode(extensions.code) ||
    (typeof extensions.code === 'string' ? graphqlCodeStatusMap[extensions.code] : undefined)
  );
}

function getNetworkStatusCode(networkError: ApolloError['networkError']) {
  return (
    normalizeStatusCode((networkError as { statusCode?: unknown } | undefined)?.statusCode) ||
    normalizeStatusCode((networkError as { status?: unknown } | undefined)?.status)
  );
}

export function formatError(error: unknown, fallback = 'Internal Server Error') {
  if (error instanceof ApolloError) {
    const networkError = error.networkError;
    let graphQLErrors = error.graphQLErrors;

    const resultErrors =
      networkError &&
      typeof (networkError as { result?: unknown }).result === 'object' &&
      (networkError as { result?: { errors?: typeof graphQLErrors } }).result?.errors;

    if (!graphQLErrors?.length && resultErrors) {
      graphQLErrors = resultErrors;
    }

    if (Array.isArray(graphQLErrors) && graphQLErrors.length) {
      const extensions = graphQLErrors.find((graphqlError) =>
        resolveGraphqlErrorStatusCode(graphqlError.extensions),
      )?.extensions;
      const message =
        graphQLErrors.length === 1
          ? graphQLErrors[0].message || error.message || fallback
          : `Errors: ${graphQLErrors
              .map((graphqlError) => graphqlError.message)
              .filter(Boolean)
              .reduce((acc, current) => {
                if (!acc.includes(current)) {
                  acc.push(current);
                }
                return acc;
              }, [] as string[])
              .join('; ')}`;

      return new GraphQLFormattedError(message, resolveGraphqlErrorStatusCode(extensions) || 500, error);
    }

    if (networkError) {
      return new GraphQLFormattedError(
        networkError.message || error.message || fallback,
        getNetworkStatusCode(networkError) || 500,
        error,
      );
    }

    return new GraphQLFormattedError(error.message || fallback, 500, error);
  }

  return new GraphQLFormattedError(error instanceof Error && error.message ? error.message : fallback, 500, error);
}
