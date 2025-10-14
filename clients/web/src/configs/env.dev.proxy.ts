import type { EnvConfig } from './env';

const origin = typeof window !== 'undefined' ? window.location.origin : '';
const clientId = '3d136433-977f-40c7-8702-a0444a6b2a9f';

export const envConfig: EnvConfig = {
  basicApiBase: '/action/basic/api',
  basicGraphqlBase: '/action/basic/graphql',
  identityGraphqlBase: '/action/identity/graphql',
  getOidcSettings: (baseUrl = '/') => ({
    authority: 'http://localhost:5003/oauth2',
    client_id: clientId,
    redirect_uri: origin + baseUrl + 'signin.html',
    post_logout_redirect_uri: origin + baseUrl.replace(/\/$/, ''),
    accessTokenExpiringNotificationTime: 10,
    automaticSilentRenew: true,
    silent_redirect_uri: origin + baseUrl + 'signin-silent.html',
    response_type: 'code',
    scope: 'openid profile offline_access',
    revokeAccessTokenOnSignout: true,
    redirectMethod: 'replace',
    mergeClaims: true,
    monitorSession: true,
  }),
};
