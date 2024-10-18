import { split, from } from '@apollo/client/core';
import { getMainDefinition } from '@apollo/client/utilities';
import { getEnv, absoluteGo } from '@ace-util/core';
import { auth } from '@/auth';
import { i18n } from '@/i18n';
import { createHttpUploadLink, createWebsocketLink, setHeaders, errorHandler } from './utils/links';

const graphqhBase = getEnv('basicGraphqlBase', `${window.location.origin}/graphql`, window._ENV);
const graphqlSubscriptionBase = getEnv('graphqlSubscriptionBase', graphqhBase.replace(/^http/, 'ws'), window._ENV);

/**
 * Infrastructure graphql links with upload fetch and websocket
 */
export const basicLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
  },
  createWebsocketLink(graphqlSubscriptionBase, {
    connectionParams: async () => {
      const token = await auth
        .getUserManager()
        .getUser()
        .then((user) => user?.access_token)
        .catch(() => '');

      return {
        token,
        lang: i18n.locale,
      };
    },
  }),
  from([
    errorHandler({
      unauthHandler: () => auth.getUserManager().signin(),
      retry: async () => {
        const user = await auth.getUserManager().signinSilent?.();
        if (user && !user.expired) {
          return {
            Authorization: `Bearer ${user.access_token}`,
          };
        } else {
          throw new Error('Unauthorization, user not found!');
        }
      },
      initialize: () => {
        absoluteGo(process.env.BASE_URL + 'initialize');
      },
    }),
    setHeaders(async () => {
      const accessToken = await auth
        .getUserManager()
        .getUser()
        .then((user) => user?.access_token)
        .catch(() => '');
      const headers = {};

      accessToken && (headers['Authorization'] = `Bearer ${accessToken}`);
      i18n.locale && (headers['x-custom-locale'] = i18n.locale);

      return headers;
    }),
    createHttpUploadLink(graphqhBase),
  ]),
);
