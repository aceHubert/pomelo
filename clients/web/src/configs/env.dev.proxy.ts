import { envConfig as baseEnvConfig, getDefaultOidcSettings, type EnvConfig } from './env';
import type { UserManagerSettings } from 'oidc-client-ts';

let runtimeOidcSettings: UserManagerSettings | undefined;

export const envConfig = {
  ...baseEnvConfig,
  basicApiBase: '/action/basic/api',
  basicGraphqlBase: '/action/basic/graphql',
  identityGraphqlBase: '/action/identity/graphql',
  getOidcSettings: () =>
    runtimeOidcSettings || {
      ...getDefaultOidcSettings(),
      authority: 'http://localhost:5003/oauth2',
    },
  setOidcSettings: (settings?: UserManagerSettings) => {
    runtimeOidcSettings = settings;
  },
} satisfies EnvConfig;
