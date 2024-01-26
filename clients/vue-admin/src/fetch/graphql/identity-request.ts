import { ApolloClient, InMemoryCache, from } from '@apollo/client/core';
import { getEnv } from '@ace-util/core';
import { Request } from '@ace-pomelo/shared-client';
import { loadingRef, errorRef, SharedError } from '@/shared';
import { createHttpLink, authLink, errorLink } from './links';

/**
 * apollo client
 */
const client = new ApolloClient({
  link: from([
    errorLink,
    authLink,
    createHttpLink(getEnv('identityGraphqlBase', `${window.location.origin}/graphql`, window._ENV)),
  ]),
  cache: new InMemoryCache(),
  defaultOptions: {
    query: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
    },
    mutate: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
    },
    watchQuery: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
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
