import { Attributes, CreationAttributes } from 'sequelize';
import IdentityResources from '../entities/identity-resources.entity';
import IdentityClaims from '../entities/identity-claims.entity';
import IdentityProperties from '../entities/identity-properties.entity';
import { PagedArgs, Paged } from './paged.interface';

export interface IdentityResourceModel extends Attributes<IdentityResources> {
  readonly updatedAt: Date;
  readonly createdAt: Date;
}

export interface PagedIdentityResourceArgs<F extends keyof IdentityResourceModel = 'name' | 'displayName'>
  extends PagedArgs {
  /**
   * 根据 keywordField 模糊查询
   */
  keyword?: string;

  /**
   * keyword 查询字段
   * @default name
   */
  keywordField?: F;

  /**
   * 是否可编辑
   */
  nonEditable?: boolean;

  /**
   * 是否启用
   */
  enabled?: boolean;
}

export interface PagedIdentityResource extends Paged<IdentityResourceModel> {}

export interface NewIdentityResourceInput extends Omit<CreationAttributes<IdentityResources>, 'id'> {}

export interface UpdateIdentityResourceInput extends Partial<NewIdentityResourceInput> {}

export interface IdentityClaimModel extends Attributes<IdentityClaims> {}
export interface IdentityClaimsModel extends Pick<IdentityResourceModel, 'id' | 'name' | 'displayName'> {
  claims: Array<Pick<IdentityClaimModel, 'id' | 'type'>>;
}
export interface NewIdentityClaimInput extends Omit<CreationAttributes<IdentityClaims>, 'id' | 'identityResourceId'> {}

export interface IdentityPropertyModel extends Attributes<IdentityProperties> {}
export interface IdentityPropertiesModel extends Pick<IdentityResourceModel, 'id' | 'name' | 'displayName'> {
  properties: Array<Pick<IdentityPropertyModel, 'id' | 'key' | 'value'>>;
}
export interface NewIdentityPropertyInput
  extends Omit<CreationAttributes<IdentityProperties>, 'id' | 'identityResourceId'> {}
