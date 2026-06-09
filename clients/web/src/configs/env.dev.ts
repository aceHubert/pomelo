import { envConfig as baseEnvConfig, getDefaultOidcSettings, type EnvConfig } from './env';
import type { UserManagerSettings } from 'oidc-client-ts';

let runtimeOidcSettings: UserManagerSettings | undefined;

export const envConfig = {
  ...baseEnvConfig,
  basicApiBase: 'http://localhost:9080/pomelo/basic/api',
  basicGraphqlBase: 'http://localhost:5002/graphql',
  identityGraphqlBase: 'http://localhost:5002/graphql',
  getOidcSettings: () =>
    runtimeOidcSettings || {
      ...getDefaultOidcSettings(),
      authority: 'http://localhost:5003/oauth2',
    },
  setOidcSettings: (settings?: UserManagerSettings) => {
    runtimeOidcSettings = settings;
  },
} satisfies EnvConfig;
