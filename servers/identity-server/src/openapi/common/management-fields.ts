export const CLIENT_DETAIL_FIELDS = [
  'applicationType',
  'clientId',
  'clientName',
  'clientUri',
  'defaultMaxAge',
  'idTokenSignedResponseAlg',
  'initiateLoginUri',
  'jwksUri',
  'logoUri',
  'policyUri',
  'requireAuthTime',
  'sectorIdentifierUri',
  'subjectType',
  'tokenEndpointAuthMethod',
  'idTokenLifetime',
  'accessTokenFormat',
  'accessTokenLifetime',
  'refreshTokenExpiration',
  'refreshTokenAbsoluteLifetime',
  'refreshTokenSlidingLifetime',
  'authorizationCodeLifetime',
  'deviceCodeLifetime',
  'backchannelAuthenticationRequestLifetime',
  'requireConsent',
  'requirePkce',
  'enabled',
  'updatedAt',
  'createdAt',
];

export const CLIENT_LIST_FIELDS = ['applicationType', 'clientId', 'clientName', 'enabled', 'updatedAt', 'createdAt'];

export const API_RESOURCE_FIELDS = [
  'id',
  'name',
  'displayName',
  'description',
  'lastAccessed',
  'nonEditable',
  'enabled',
  'updatedAt',
  'createdAt',
];

export const API_SCOPE_FIELDS = [
  'id',
  'apiResourceId',
  'name',
  'displayName',
  'description',
  'emphasize',
  'required',
  'showInDiscoveryDocument',
];

export const IDENTITY_RESOURCE_FIELDS = [
  'id',
  'name',
  'displayName',
  'description',
  'emphasize',
  'required',
  'showInDiscoveryDocument',
  'nonEditable',
  'enabled',
  'updatedAt',
  'createdAt',
];

export const OWNER_FIELDS = ['id', 'name', 'displayName', 'nonEditable'];
export const CLIENT_OWNER_FIELDS = ['clientId', 'clientName'];
export const CLAIM_FIELDS = ['id', 'type', 'value'];
export const TYPE_ONLY_CLAIM_FIELDS = ['id', 'type'];
export const PROPERTY_FIELDS = ['id', 'key', 'value'];
export const CLIENT_CORS_ORIGIN_FIELDS = ['id', 'origin'];
export const CLIENT_GRANT_TYPE_FIELDS = ['id', 'grantType'];
export const CLIENT_SCOPE_FIELDS = ['id', 'scope'];
export const CLIENT_REDIRECT_URI_FIELDS = ['id', 'redirectUri'];
export const CLIENT_POST_LOGOUT_REDIRECT_URI_FIELDS = ['id', 'postLogoutRedirectUri'];
export const SECRET_FIELDS = ['id', 'type', 'expiresAt', 'description', 'createdAt'];
