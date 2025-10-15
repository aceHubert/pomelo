import { split, from } from '@apollo/client/core';
import { getMainDefinition } from '@apollo/client/utilities';
import { absoluteGo } from '@ace-util/core';
import { envConfig } from '@/configs/env';
import { Authoriztion } from '@/auth';
import { i18n } from '@/i18n';
import { createHttpUploadLink, createWebsocketLink, setHeaders, errorHandler } from './utils/links';

const graphqhBase = envConfig.basicGraphqlBase;
let graphqlSubscriptionBase =
  envConfig.graphqlSubscriptionBase ||
  (/^https?/.test(graphqhBase) ? graphqhBase : location.origin + graphqhBase).replace(/^http/, 'ws');

// add key for apisix key-auth
// TODO: apisix 不支持websocket, 服务端没有配置oidc的验证但 private key 使用的同一个，暂时使用 local 验证token
graphqlSubscriptionBase += `${graphqlSubscriptionBase.indexOf('?') >= 0 ? '&' : '?'}apikey=pomelo-local`;
// }apikey=pomelo-${Authoriztion.authType.toLowerCase()}`;

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
      unauthorize: () =>
        Authoriztion.getInstance().userManager.signin({
          noInteractive: true,
          // popup: true,
        }),
      retry: async () => {
        const token = await Authoriztion.getInstance()
          .userManager.signinSilent?.()
          .then((user) => {
            if (!user || user.expired) return '';

            return [user.token_type, user.access_token].filter(Boolean).join(' ');
          })
          .catch(() => '');

        if (token) {
          return {
            Authorization: token,
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
      const instance = Authoriztion.getInstance(),
        userManager = instance.userManager,
        token = await userManager
          .getUser()
          .then((user) => {
            if (!user || user.expired) return '';

            return [user.token_type, user.access_token].filter(Boolean).join(' ');
          })
          .catch(() => '');
      const headers = {
        apikey: `pomelo-${Authoriztion.authType.toLowerCase()}`,
      };

      token && (headers['Authorization'] = token);
      i18n.locale && (headers['x-custom-locale'] = i18n.locale);

      return headers;
    }),
    createHttpUploadLink(graphqhBase),
  ]),
);
