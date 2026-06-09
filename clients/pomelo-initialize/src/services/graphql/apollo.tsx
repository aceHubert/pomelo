import { ApolloClient, ApolloProvider, HttpLink, InMemoryCache } from '@apollo/client';
import type { ApolloClientOptions, NormalizedCacheObject } from '@apollo/client';
import type { PropsWithChildren } from 'react';

const DEFAULT_GRAPHQL_URI = '/action/basic/graphql';

export function resolveGraphqlUri() {
  const configuredUri = import.meta.env.VITE_GRAPHQL_URI?.trim() || import.meta.env.VITE_BASIC_GRAPHQL_URI?.trim();
  if (!configuredUri) return DEFAULT_GRAPHQL_URI;

  if (/^https?:\/\//i.test(configuredUri)) return configuredUri;
  return configuredUri.startsWith('/') ? configuredUri : `/${configuredUri}`;
}

export function createInitializeApolloClient(options?: Partial<ApolloClientOptions<NormalizedCacheObject>>) {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: resolveGraphqlUri(),
    }),
    ...options,
  });
}

export function InitializeApolloProvider({
  client,
  children,
}: PropsWithChildren<{ client: ApolloClient<NormalizedCacheObject> }>) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
