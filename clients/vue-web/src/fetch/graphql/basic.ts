import { split, from } from '@apollo/client/core';
import { getMainDefinition } from '@apollo/client/utilities';
import { getEnv, absoluteGo } from '@ace-util/core';
import { Authoriztion } from '@/auth';
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
      const userManager = Authoriztion.getInstance().userManager,
        token = await userManager
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
      unauthorize: () => Authoriztion.getInstance().userManager.signin(),
      retry: async () => {
        const user = await Authoriztion.getInstance().userManager.signinSilent?.();
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
      const userManager = Authoriztion.getInstance().userManager,
        token = await userManager
          .getUser()
          .then((user) => user?.access_token)
          .catch(() => '');
      const headers = {};

      token && (headers['Authorization'] = `Bearer ${token}`);
      i18n.locale && (headers['x-custom-locale'] = i18n.locale);

      return headers;
    }),
    createHttpUploadLink(graphqhBase),
  ]),
);
