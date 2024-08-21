import { split, from } from '@apollo/client/core';
import { getMainDefinition } from '@apollo/client/utilities';
import { getEnv } from '@ace-util/core';
import { Request } from '@ace-pomelo/shared-client';
import { loadingRef, errorRef, SharedError } from '@/shared';
import { createClient } from './utils/client';
import { createHttpUploadLink, createWebsocketLink, authLink, errorLink } from './utils/links';

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
  },
  createWebsocketLink(
    getEnv('basicGraphqlSubscriptionBase', `${window.location.origin.replace(/^http/, 'ws')}/graphql`, window._ENV),
  ),
  from([
    errorLink,
    authLink,
    createHttpUploadLink(getEnv('basicGraphqlBase', `${window.location.origin}/graphql`, window._ENV)),
  ]),
);

// Request instance
export const request = new Request(createClient(splitLink), {
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
