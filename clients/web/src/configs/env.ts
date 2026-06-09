import type { UserManagerSettings } from 'oidc-client-ts';

export interface EnvConfig {
  basicApiBase: string;
  basicGraphqlBase: string;
  identityGraphqlBase: string;
  graphqlSubscriptionBase?: string;
  getOidcSettings: () => UserManagerSettings;
  resolveOidcSettings: (authOidc?: unknown) => UserManagerSettings | undefined;
  setOidcSettings: (settings?: UserManagerSettings) => void;
}

const origin = typeof window !== 'undefined' ? window.location.origin : '';
const baseUrl = origin + (process.env.BASE_URL || '/');
const clientId = '3d136433-977f-40c7-8702-a0444a6b2a9f';
let runtimeOidcSettings: UserManagerSettings | undefined;

export function getDefaultOidcSettings(): UserManagerSettings {
  return {
    authority: origin + '/oauth2',
    client_id: clientId,
    redirect_uri: baseUrl + 'signin.html',
    post_logout_redirect_uri: baseUrl.replace(/\/$/, ''),
    accessTokenExpiringNotificationTimeInSeconds: 10,
    automaticSilentRenew: true,
    silent_redirect_uri: baseUrl + 'signin-silent.html',
    response_type: 'code',
    scope: 'openid profile offline_access',
    revokeTokensOnSignout: true,
    revokeTokenAdditionalContentTypes: ['text/plain'],
    redirectMethod: 'replace',
    mergeClaimsStrategy: { array: 'replace' },
    monitorSession: true,
  };
}

function parseAuthOidc(authOidc?: unknown): string | Record<string, any> | undefined {
  if (!authOidc) {
    return;
  }

  if (typeof authOidc !== 'string') {
    return authOidc as Record<string, any>;
  }

  const value = authOidc.trim();
  if (!value) {
    return;
  }

  if (value.startsWith('{')) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  return value;
}

function normalizeEndpointMetadata(endpoints?: Record<string, string>) {
  if (!endpoints) {
    return undefined;
  }

  return {
    authorization_endpoint: endpoints.authorization_endpoint || endpoints.authorizationEndpoint,
    token_endpoint: endpoints.token_endpoint || endpoints.tokenEndpoint,
    userinfo_endpoint: endpoints.userinfo_endpoint || endpoints.userinfoEndpoint,
    jwks_uri: endpoints.jwks_uri || endpoints.jwksUri,
    end_session_endpoint: endpoints.end_session_endpoint || endpoints.endSessionEndpoint,
    revocation_endpoint: endpoints.revocation_endpoint || endpoints.revocationEndpoint,
  };
}

function resolveOidcSettings(authOidc?: unknown): UserManagerSettings | undefined {
  const option = parseAuthOidc(authOidc);
  if (!option) {
    return;
  }

  const defaults = getDefaultOidcSettings();
  if (typeof option === 'string') {
    const wellKnownSuffix = '/.well-known/openid-configuration';
    return option.endsWith(wellKnownSuffix)
      ? {
          ...defaults,
          authority: option.substring(0, option.length - wellKnownSuffix.length),
          metadataUrl: option,
        }
      : {
          ...defaults,
          authority: option,
        };
  }

  const { endpoints, metadata, ...settings } = option;
  return {
    ...defaults,
    ...settings,
    metadata: {
      ...normalizeEndpointMetadata(endpoints),
      ...metadata,
    },
  };
}

export const envConfig: EnvConfig = {
  basicApiBase: '/action/basic/api',
  basicGraphqlBase: '/action/basic/graphql',
  identityGraphqlBase: '/action/identity/graphql',
  getOidcSettings: () => runtimeOidcSettings || getDefaultOidcSettings(),
  resolveOidcSettings,
  setOidcSettings: (settings?: UserManagerSettings) => {
    runtimeOidcSettings = settings;
  },
};
