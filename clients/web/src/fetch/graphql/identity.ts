import { from } from '@apollo/client/core';
import { getEnv, absoluteGo } from '@ace-util/core';
import { Authoriztion } from '@/auth';
import { i18n } from '@/i18n';
import { createHttpLink, setHeaders, errorHandler } from './utils/links';

const graphqlBase = getEnv('identityGraphqlBase', `${window.location.origin}/graphql`, window._ENV);

//  Identity graphql link
export const identityLink = from([
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
    const instance = Authoriztion.getInstance(),
      userManager = instance.userManager,
      authorization = await userManager
        .getUser()
        .then((user) => {
          if (!user || user.expired) return '';
          return [user.token_type, user.access_token].filter(Boolean).join(' ');
        })
        .catch(() => '');
    const headers = {
      apikey: `pomelo-${Authoriztion.authType.toLowerCase()}`,
    };

    authorization && (headers['Authorization'] = authorization);
    i18n.locale && (headers['x-custom-locale'] = i18n.locale);

    return headers;
  }),
  createHttpLink(graphqlBase),
]);
