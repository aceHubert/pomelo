import { Attributes, CreationAttributes } from 'sequelize';
import { ApiResources } from '../entities/api-resources.entity';
import { ApiClaims } from '../entities/api-claims.entity';
import { ApiScopes } from '../entities/api-scopes.entity';
import { ApiScopeClaims } from '../entities/api-scope-claims.entity';
import { ApiSecrets } from '../entities/api-secrets.entity';
import { ApiProperties } from '../entities/api-properties.entity';
import { PagedArgs, Paged } from './paged.interface';

export interface ApiResourceModel extends Attributes<ApiResources> {
  readonly updatedAt: Date;
  readonly createdAt: Date;
}

export interface PagedApiResourceArgs<F extends keyof ApiResourceModel = 'name' | 'displayName'> extends PagedArgs {
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

export interface PagedApiResource extends Paged<ApiResourceModel> {}

export interface NewApiResourceInput extends CreationAttributes<ApiResources> {}

export interface UpdateApiResourceInput extends Partial<NewApiResourceInput> {}

export interface ApiClaimModel extends Attributes<ApiClaims> {}
export interface ApiClaimsModel extends Pick<ApiResourceModel, 'id' | 'name' | 'displayName' | 'nonEditable'> {
  claims: Array<Pick<ApiClaimModel, 'id' | 'type'>>;
}
export interface NewApiClaimInput extends Omit<CreationAttributes<ApiClaims>, 'apiResourceId'> {}

export interface ApiScopeModel extends Attributes<ApiScopes> {}
export interface PagedApiScopeArgs<F extends keyof ApiResourceModel = 'name' | 'displayName'> extends PagedArgs {
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
   * Api resource id
   */
  apiResourceId?: number;
}
export interface PagedApiScope extends Paged<ApiScopeModel> {}
export interface NewApiScopeInput extends Omit<CreationAttributes<ApiScopes>, 'apiResourceId'> {}
export interface UpdateApiScopeInput extends Partial<NewApiScopeInput> {}

export interface ApiScopeClaimModel extends Attributes<ApiScopeClaims> {}
export interface ApiScopeClaimsModel extends Pick<ApiScopeModel, 'id' | 'apiResourceId' | 'name' | 'displayName'> {
  scopeClaims: Array<Pick<ApiScopeClaimModel, 'id' | 'type'>>;
}
export interface NewApiScopeClaimInput extends Omit<CreationAttributes<ApiScopeClaims>, 'apiScopeId'> {}

export interface ApiSecretModel extends Attributes<ApiSecrets> {
  readonly createdAt: Date;
}
export interface ApiSecretsModel extends Pick<ApiResourceModel, 'id' | 'name' | 'displayName' | 'nonEditable'> {
  secrets: Array<Pick<ApiSecretModel, 'id' | 'type' | 'value' | 'expiresAt' | 'description' | 'createdAt'>>;
}
export interface NewApiSecretInput extends Omit<CreationAttributes<ApiSecrets>, 'apiResourceId'> {}

export interface ApiPropertyModel extends Attributes<ApiProperties> {}
export interface ApiPropertiesModel extends Pick<ApiResourceModel, 'id' | 'name' | 'displayName' | 'nonEditable'> {
  properties: Array<Pick<ApiPropertyModel, 'id' | 'key' | 'value'>>;
}

export interface NewApiPropertyInput extends Omit<CreationAttributes<ApiProperties>, 'apiResourceId'> {}
