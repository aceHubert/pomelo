import type { EnvConfig } from './env';

const origin = typeof window !== 'undefined' ? window.location.origin : '';
const baseUrl = origin + (process.env.BASE_URL || '/');
const clientId = '3d136433-977f-40c7-8702-a0444a6b2a9f';

export const envConfig = {
  basicApiBase: 'http://localhost:9080/pomelo/basic/api',
  basicGraphqlBase: 'http://localhost:9080/pomelo/basic/graphql',
  identityGraphqlBase: 'http://localhost:9080/pomelo/identity/graphql',
  getOidcSettings: () => ({
    authority: 'http://localhost:5003/oauth2',
    client_id: clientId,
    redirect_uri: baseUrl + 'signin.html',
    post_logout_redirect_uri: baseUrl.replace(/\/$/, ''),
    accessTokenExpiringNotificationTime: 10,
    automaticSilentRenew: true,
    silent_redirect_uri: baseUrl + 'signin-silent.html',
    response_type: 'code',
    scope: 'openid profile offline_access',
    revokeAccessTokenOnSignout: true,
    redirectMethod: 'replace',
    mergeClaims: true,
    monitorSession: true,
  }),
} satisfies EnvConfig;
