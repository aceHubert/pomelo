import { ApolloClient, InMemoryCache, type ApolloLink, type ApolloClientOptions } from '@apollo/client/core';

/**
 * apollo client
 */
export const createClient = (link: ApolloLink, options?: Optional<Omit<ApolloClientOptions<any>, 'link'>, 'cache'>) =>
  new ApolloClient({
    link,
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
    ...options,
  });
