import { ApolloClient, ApolloProvider, HttpLink, InMemoryCache, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { setContext } from '@apollo/client/link/context';
import { PropsWithChildren } from 'react';
import { clearManagementToken, getManagementToken } from '../auth/token';

const DEFAULT_GRAPHQL_URI = '/graphql';

function resolveGraphqlUri() {
  const configuredUri = import.meta.env.VITE_GRAPHQL_URI?.trim();
  if (!configuredUri) return DEFAULT_GRAPHQL_URI;

  if (/^https?:\/\//i.test(configuredUri)) return configuredUri;
  return configuredUri.startsWith('/') ? configuredUri : `/${configuredUri}`;
}

export function createManagementApolloClient(onUnauthorized: () => void) {
  const authLink = setContext((_, { headers }) => {
    const token = getManagementToken();
    return {
      headers: {
        ...headers,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    };
  });

  const unauthorizedLink = onError(({ graphQLErrors, networkError }) => {
    const statusCode = (networkError as any)?.statusCode || (networkError as any)?.status;
    const graphUnauthorized = Array.isArray(graphQLErrors)
      ? graphQLErrors.some((error) => {
          const graphStatusCode = (error.extensions?.response as any)?.statusCode || error.extensions?.statusCode;
          const graphCode = error.extensions?.code;

          return (
            graphStatusCode === 401 ||
            graphStatusCode === 403 ||
            graphCode === 'UNAUTHORIZED' ||
            graphCode === 'UNAUTHENTICATED' ||
            graphCode === 'FORBIDDEN'
          );
        })
      : false;

    if (statusCode === 401 || statusCode === 403 || graphUnauthorized) {
      clearManagementToken();
      onUnauthorized();
    }
  });

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: from([unauthorizedLink, authLink, new HttpLink({ uri: resolveGraphqlUri() })]),
  });
}

export function ManagementApolloProvider({ client, children }: PropsWithChildren<{ client: ApolloClient<unknown> }>) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
