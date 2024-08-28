import { IRAMActionDefine } from '@ace-pomelo/ram-authorization';

export class ClientAction implements IRAMActionDefine {
  static readonly Detail = 'client.detail';
  static readonly PagedList = 'client.paged-list';
  static readonly Create = 'client.create';
  static readonly Update = 'client.update';
  static readonly Claims = 'client.claims';
  static readonly CreateClaim = 'client.claim.create';
  static readonly DeleteClaim = 'client.claim.delete';
  static readonly CorsOrigins = 'client.cors-origins';
  static readonly CreateCorsOrigin = 'client.cors-origin.create';
  static readonly DeleteCorsOrigin = 'client.cors-origin.delete';
  static readonly Scopes = 'client.scopes';
  static readonly CreateScope = 'client.scope.create';
  static readonly DeleteScope = 'client.scope.delete';
  static readonly GrantTypes = 'client.grant-types';
  static readonly CreateGrantType = 'client.grant-type.create';
  static readonly DeleteGrantType = 'client.grant-type.delete';
  static readonly RedirectUris = 'client.redirect-uris';
  static readonly CreateRedirectUri = 'client.redirect-uri.create';
  static readonly DeleteRedirectUri = 'client.redirect-uri.delete';
  static readonly PostLogoutRedirectUris = 'client.post-logout-redirect-uris';
  static readonly CreatePostLogoutRedirectUri = 'client.post-logout-redirect-uri.create';
  static readonly DeletePostLogoutRedirectUri = 'client.post-logout-redirect-uri.delete';
  static readonly Secrets = 'client.secrets';
  static readonly CreateSecret = 'client.secret.create';
  static readonly DeleteSecret = 'client.secret.delete';
  static readonly Properties = 'client.properties';
  static readonly CreateProperty = 'client.property.create';
  static readonly DeleteProperty = 'client.property.delete';
}
