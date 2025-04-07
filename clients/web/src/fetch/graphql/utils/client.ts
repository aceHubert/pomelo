import { ApolloClient, InMemoryCache, type ApolloLink, type ApolloClientOptions } from '@apollo/client/core';
import { formatError } from './helpers';

/**
 * apollo client
 */
export const createClient = (link: ApolloLink, options?: Optional<Omit<ApolloClientOptions<any>, 'link'>, 'cache'>) => {
  const client = new ApolloClient({
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
  // https://github.com/apollographql/apollo-feature-requests/issues/116
  const { query, mutate } = client;
  client.query = (...args: any) =>
    query.apply(client, args).catch((e) => {
      throw formatError(e);
    }) as any;

  client.mutate = (...args: any) =>
    mutate.apply(client, args).catch((e) => {
      throw formatError(e);
    }) as any;

  return client;
};
