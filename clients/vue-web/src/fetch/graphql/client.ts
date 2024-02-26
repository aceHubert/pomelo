import { ApolloClient, type ApolloLink, InMemoryCache } from '@apollo/client/core';

/**
 * apollo client
 */
export const createClient = (link: ApolloLink, cache = new InMemoryCache()) =>
  new ApolloClient({
    link,
    cache,
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
