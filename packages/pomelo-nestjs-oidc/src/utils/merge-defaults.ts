import { OidcModuleOptions } from '../interfaces';

const DefaultResponseType = 'code';
const DefaultScope = 'openid';

const defaultModuleOptions: Partial<OidcModuleOptions> = {
  // client config
  authParams: {
    response_type: DefaultResponseType,
    scope: DefaultScope,
  },

  // behavior flags
  filterProtocolClaims: true,
  loadUserInfo: false,
  mergeClaimsStrategy: { array: 'replace' },

  // other behavior
  usePKCE: true,
};

export function mergeDefaults(options: Omit<OidcModuleOptions, 'isGlobal'>): Omit<OidcModuleOptions, 'isGlobal'> {
  const newOptions = { ...defaultModuleOptions, ...options };

  newOptions.authParams = { ...defaultModuleOptions.authParams, ...options.authParams };

  return newOptions;
}
