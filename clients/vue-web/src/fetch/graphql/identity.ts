import { from } from '@apollo/client/core';
import { getEnv, absoluteGo } from '@ace-util/core';
import { auth } from '@/auth';
import { i18n } from '@/i18n';
import { createHttpLink, setHeaders, errorHandler } from './utils/links';

const graphqlBase = getEnv('identityGraphqlBase', `${window.location.origin}/graphql`, window._ENV);

//  Identity graphql link
export const identityLink = from([
  errorHandler({
    unauthHandler: () => auth.userManager.signin(),
    retry: async () => {
      const user = await auth.userManager.signinSilent();
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
    const accessToken = await auth.userManager
      .getUser()
      .then((user) => user?.access_token)
      .catch(() => '');
    const headers = {};

    accessToken && (headers['Authorization'] = `Bearer ${accessToken}`);
    i18n.locale && (headers['x-custom-locale'] = i18n.locale);

    return headers;
  }),
  createHttpLink(graphqlBase),
]);
