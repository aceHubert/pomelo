import { IRAMActionDefine } from '@ace-pomelo/ram-authorization';

export class ApiResourceAction implements IRAMActionDefine {
  static readonly Detail = 'api-resource.detail';
  static readonly PagedList = 'api-resource.paged-list';
  static readonly Create = 'api-resource.create';
  static readonly Update = 'api-resource.update';
  static readonly Delete = 'api-resource.delete';
  static readonly Claims = 'api-resource.claims';
  static readonly CreateClaim = 'api-resource.claim.create';
  static readonly DeleteClaim = 'api-resource.claim.delete';
  static readonly ScopePagedList = 'client.scope.page-list';
  static readonly ScopeDetail = 'client.scope.detail';
  static readonly CreateScope = 'client.scope.create';
  static readonly DeleteScope = 'client.scope.delete';
  static readonly ScopeClaims = 'client.scope-claims';
  static readonly CreateScopeClaim = 'client.scope-claim.create';
  static readonly DeleteScopeClaim = 'client.scope-claim.delete';
  static readonly Secrets = 'client.secrets';
  static readonly CreateSecret = 'client.secret.create';
  static readonly DeleteSecret = 'client.secret.expired';
  static readonly Properties = 'api-resource.properties';
  static readonly CreateProperty = 'api-resource.property.create';
  static readonly DeleteProperty = 'api-resource.property.delete';
}
