import { ApolloClient, InMemoryCache, split, from } from '@apollo/client/core';
import { getMainDefinition } from '@apollo/client/utilities';
import { getEnv } from '@ace-util/core';
import { Request } from '@ace-pomelo/shared-client';
import { loadingRef, errorRef, SharedError } from '@/shared';
import { createHttpUploadLink, createWebsocketLink, authLink, errorLink } from './links';

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
  },
  createWebsocketLink(
    getEnv('infrastructureGraphqlWsBase', `${window.location.origin.replace(/^http/, 'ws')}/graphql`, window._ENV),
  ),
  from([
    errorLink,
    authLink,
    createHttpUploadLink(getEnv('infrastructureGraphqlBase', `${window.location.origin}/graphql`, window._ENV)),
  ]),
);

/**
 * apollo client
 */
const client = new ApolloClient({
  link: splitLink,
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
