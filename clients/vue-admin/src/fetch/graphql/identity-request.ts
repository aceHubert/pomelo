import { from } from '@apollo/client/core';
import { getEnv } from '@ace-util/core';
import { Request } from '@ace-pomelo/shared-client';
import { loadingRef, errorRef, SharedError } from '@/shared';
import { createClient } from './client';
import { createHttpLink, authLink, errorLink } from './links';

// Request instance
export const request = new Request(
  createClient(
    from([
      errorLink,
      authLink,
      createHttpLink(getEnv('identityGraphqlBase', `${window.location.origin}/graphql`, window._ENV)),
    ]),
  ),
  {
    loading() {
      loadingRef.value = true;
      return () => {
        loadingRef.value = false;
      };
    },
    onCatch(err: any) {
      errorRef.value = new SharedError(err.message, err.code);
    },
  },
);
