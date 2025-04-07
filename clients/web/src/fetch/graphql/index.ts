import Vue from 'vue';
import { createRetryPlugin, createLoadingPlugin, createCatchErrorPlugin } from '@ace-fetch/graphql';
import { FetchVuePlugin, createFetch } from '@ace-fetch/graphql-vue';
import { loadingRef, errorRef, SharedError } from '@/shared';
import { createClient } from './utils/client';
import { basicLink } from './basic';

Vue.use(FetchVuePlugin);

export const graphqlFetch = createFetch(({ link, ...options } = {}) => {
  return createClient(link || basicLink, options);
});

graphqlFetch.use(
  createRetryPlugin({
    maxCount: 3,
    delay: true,
  }),
);

graphqlFetch.use(
  createLoadingPlugin({
    handler: () => {
      loadingRef.value = true;
      return () => {
        loadingRef.value = false;
      };
    },
  }),
);

graphqlFetch.use(
  createCatchErrorPlugin({
    handler: (error) => {
      if (error instanceof SharedError) {
        errorRef.value = error;
      } else {
        errorRef.value = new SharedError(error.message, error.code);
      }
      return new Promise(() => {
        // stop next
      });
    },
  }),
);
