import { Attributes, CreationAttributes } from 'sequelize';
import Clients from '../entities/clients.entity';
import ClientCorsOrigins from '../entities/client-cors-origins.entity';
import ClientClaims from '../entities/client-claims.entity';
import ClientGrantTypes from '../entities/client-grant-types.entity';
import ClientScopes from '../entities/client-scopes.entity';
import ClientRedirectUris from '../entities/client-redirect-uris.entity';
import ClientPostLogoutRedirectUris from '../entities/client-post-logout-redirect-uris.entity';
import ClientSecrets from '../entities/client-secrets.entity';
import ClientProperties from '../entities/client-properties.entity';
import { PagedArgs, Paged } from './paged.interface';

export interface ClientModel extends Attributes<Clients> {
  readonly updatedAt: Date;
  readonly createdAt: Date;
}

export interface PagedClientArgs extends PagedArgs {
  /**
   * 根据 name 模糊查询
   */
  clientName?: string;
}

export interface PagedClient extends Paged<Pick<ClientModel, 'applicationType' | 'clientId' | 'clientName'>> {}

export interface NewClientInput extends Omit<CreationAttributes<Clients>, 'id'> {}

export interface UpdateClientInput extends Partial<Omit<NewClientInput, 'clientId'>> {}

export interface ClientClaimModel extends Attributes<ClientClaims> {}
export interface ClientClaimsModel extends Pick<ClientModel, 'clientId' | 'clientName'> {
  claims: Array<Pick<ClientClaimModel, 'id' | 'type' | 'value'>>;
}
export interface NewClientClaimInput extends Omit<CreationAttributes<ClientClaims>, 'id' | 'clientId'> {}

export interface ClientCorsOriginModel extends Attributes<ClientCorsOrigins> {}
export interface ClientCorsOriginsModel extends Pick<ClientModel, 'clientId' | 'clientName'> {
  corsOrigins: Array<Pick<ClientCorsOriginModel, 'id' | 'origin'>>;
}
export interface NewClientCorsOriginInput extends Omit<CreationAttributes<ClientCorsOrigins>, 'id' | 'clientId'> {}

export interface ClientGrantTypeModel extends Attributes<ClientGrantTypes> {}
export interface ClientGrantTypesModel extends Pick<ClientModel, 'clientId' | 'clientName'> {
  grantTypes: Array<Pick<ClientGrantTypeModel, 'id' | 'grantType'>>;
}
export interface NewClientGrantTypeInput extends Omit<CreationAttributes<ClientGrantTypes>, 'id' | 'clientId'> {}

export interface ClientScopeModel extends Attributes<ClientScopes> {}
export interface ClientScopesModel extends Pick<ClientModel, 'clientId' | 'clientName'> {
  scopes: Array<Pick<ClientScopeModel, 'id' | 'scope'>>;
}
export interface NewClientScopeInput extends Omit<CreationAttributes<ClientScopes>, 'id' | 'clientId'> {}

export interface ClientRedirectUriModel extends Attributes<ClientRedirectUris> {}
export interface ClientRedirectUrisModel extends Pick<ClientModel, 'clientId' | 'clientName'> {
  redirectUris: Array<Pick<ClientRedirectUriModel, 'id' | 'redirectUri'>>;
}
export interface NewClientRedirectUriInput extends Omit<CreationAttributes<ClientRedirectUris>, 'id' | 'clientId'> {}

export interface ClientPostLogoutRedirectUriModel extends Attributes<ClientPostLogoutRedirectUris> {}
export interface ClientPostLogoutRedirectUrisModel extends Pick<ClientModel, 'clientId' | 'clientName'> {
  postLogoutRedirectUris: Array<Pick<ClientPostLogoutRedirectUriModel, 'id' | 'postLogoutRedirectUri'>>;
}
export interface NewClientPostLogoutRedirectUriInput
  extends Omit<CreationAttributes<ClientPostLogoutRedirectUris>, 'id' | 'clientId'> {}

export interface ClientSecretModel extends Attributes<ClientSecrets> {
  readonly createdAt: Date;
}
export interface ClientSecretsModel extends Pick<ClientModel, 'clientId' | 'clientName'> {
  secrets: Array<Pick<ClientSecretModel, 'id' | 'type' | 'value' | 'expiresAt' | 'description' | 'createdAt'>>;
}
export interface NewClientSecretInput extends Omit<CreationAttributes<ClientSecrets>, 'id' | 'clientId'> {}

export interface ClientPropertyModel extends Attributes<ClientProperties> {}
export interface ClientPropertiesModel extends Pick<ClientModel, 'clientId' | 'clientName'> {
  properties: Array<Pick<ClientPropertyModel, 'id' | 'key' | 'value'>>;
}
export interface NewClientPropertyInput extends Omit<CreationAttributes<ClientProperties>, 'id' | 'clientId'> {}
