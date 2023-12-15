import { ApolloClient, InMemoryCache, split, from } from '@apollo/client/core';
import { getMainDefinition } from '@apollo/client/utilities';
import { createUploadLink } from 'apollo-upload-client';
import { getEnv } from '@ace-util/core';
import { loadingRef, errorRef, SharedError } from '@/shared';
import { Request } from '../request';
import { wsLink, authLink, errorLink } from './links';
import { customFetch } from './custom-fetch';

const uploadLink = createUploadLink({
  uri: getEnv('infrastructureGraphqlBase', `${window.location.origin}/graphql`, window._ENV),
  headers: {
    // https://www.apollographql.com/docs/apollo-server/security/cors/#preventing-cross-site-request-forgery-csrf
    'Apollo-Require-Preflight': 'true',
  },
  credentials: 'same-origin',
  fetch: customFetch,
});

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
  },
  wsLink(
    getEnv('infrastructureGraphqlWsBase', `${window.location.origin.replace(/^http/, 'ws')}/graphql`, window._ENV),
  ),
  from([errorLink, authLink, uploadLink]),
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
    },
    mutate: {
      fetchPolicy: 'no-cache',
    },
    watchQuery: {
      fetchPolicy: 'no-cache',
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
