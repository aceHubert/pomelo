import { ApolloClient, ApolloError, ApolloProvider, HttpLink, InMemoryCache, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { setContext } from '@apollo/client/link/context';
import { resolveGraphqlUri } from '@/services/app/env';
import { clearStoredAuthToken, getAuthorizationHeader } from '@/services/auth/token';
import { getStoredLocale } from '@/services/i18n/i18n';
import { formatError } from './errors';
import type { PropsWithChildren } from 'react';

export function createPomeloLoginApolloClient(onUnauthorized: () => void) {
  const authLink = setContext((_, { headers }) => {
    const authorization = getAuthorizationHeader();

    return {
      headers: {
        ...headers,
        apikey: 'pomelo-local',
        'x-custom-locale': getStoredLocale(),
        ...(authorization ? { authorization } : {}),
      },
    };
  });

  const unauthorizedLink = onError(({ graphQLErrors, networkError }) => {
    const statusCode = formatError(new ApolloError({ graphQLErrors, networkError })).code;

    if (statusCode === 401 || statusCode === 403) {
      clearStoredAuthToken();
      onUnauthorized();
    }
  });

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: from([unauthorizedLink, authLink, new HttpLink({ uri: resolveGraphqlUri() })]),
  });
}

export function PomeloLoginApolloProvider({ client, children }: PropsWithChildren<{ client: ApolloClient<unknown> }>) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
