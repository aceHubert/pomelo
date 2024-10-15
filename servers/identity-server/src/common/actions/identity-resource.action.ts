import { IRAMActionDefine } from '@ace-pomelo/nestjs-ram-authorization';

export class IdentityResourceAction implements IRAMActionDefine {
  static readonly Detail = 'identity-resource.detail';
  static readonly PagedList = 'identity-resource.paged-list';
  static readonly Create = 'identity-resource.create';
  static readonly Update = 'identity-resource.update';
  static readonly Delete = 'identity-resource.delete';
  static readonly Claims = 'identity-resource.claims';
  static readonly CreateClaim = 'identity-resource.claim.create';
  static readonly DeleteClaim = 'identity-resource.claim.delete';
  static readonly Properties = 'identity-resource.properties';
  static readonly CreateProperty = 'identity-resource.property.create';
  static readonly DeleteProperty = 'identity-resource.property.delete';
}
