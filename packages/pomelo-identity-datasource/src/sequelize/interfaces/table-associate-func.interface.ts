import { ModelStatic } from 'sequelize';
import ApiClaims from '../entities/api-claims.entity';
import ApiProperties from '../entities/api-properties.entity';
import ApiResources from '../entities/api-resources.entity';
import ApiScopeClaims from '../entities/api-scope-claims.entity';
import ApiScopes from '../entities/api-scopes.entity';
import ApiSecrets from '../entities/api-secrets.entity';
import ClientClaims from '../entities/client-claims.entity';
import ClientCorsOrigins from '../entities/client-cors-origins.entity';
import ClientGrantTypes from '../entities/client-grant-types.entity';
import ClientPostLogoutRedirectUris from '../entities/client-post-logout-redirect-uris.entity';
import ClientProperties from '../entities/client-properties.entity';
import ClientRedirectUris from '../entities/client-redirect-uris.entity';
import ClientScopes from '../entities/client-scopes.entity';
import ClientSecrets from '../entities/client-secrets.entity';
import Clients from '../entities/clients.entity';
import IdentityClaims from '../entities/identity-claims.entity';
import IdentityProperties from '../entities/identity-properties.entity';
import IdentityResources from '../entities/identity-resources.entity';

export type Models = {
  ApiClaims: ModelStatic<ApiClaims>;
  ApiProperties: ModelStatic<ApiProperties>;
  ApiResources: ModelStatic<ApiResources>;
  ApiScopeClaims: ModelStatic<ApiScopeClaims>;
  ApiScopes: ModelStatic<ApiScopes>;
  ApiSecrets: ModelStatic<ApiSecrets>;
  ClientClaims: ModelStatic<ClientClaims>;
  ClientCorsOrigins: ModelStatic<ClientCorsOrigins>;
  ClientGrantTypes: ModelStatic<ClientGrantTypes>;
  ClientPostLogoutRedirectUris: ModelStatic<ClientPostLogoutRedirectUris>;
  ClientProperties: ModelStatic<ClientProperties>;
  ClientRedirectUris: ModelStatic<ClientRedirectUris>;
  ClientScopes: ModelStatic<ClientScopes>;
  ClientSecrets: ModelStatic<ClientSecrets>;
  Clients: ModelStatic<Clients>;
  IdentityClaims: ModelStatic<IdentityClaims>;
  IdentityProperties: ModelStatic<IdentityProperties>;
  IdentityResources: ModelStatic<IdentityResources>;
};

export interface TableAssociateFunc {
  (models: Models): void;
}
