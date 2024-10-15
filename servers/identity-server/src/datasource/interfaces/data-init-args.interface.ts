import { CreationAttributes } from 'sequelize';
import {
  ApiResources,
  ApiClaims,
  ApiScopes,
  ApiScopeClaims,
  ApiSecrets,
  ApiProperties,
  IdentityResources,
  IdentityClaims,
  IdentityProperties,
  Clients,
  ClientClaims,
  ClientCorsOrigins,
  ClientScopes,
  ClientGrantTypes,
  ClientRedirectUris,
  ClientPostLogoutRedirectUris,
  ClientSecrets,
  ClientProperties,
} from '../sequelize/entities';

export interface DataInitArgs {
  apiResources?: Array<
    CreationAttributes<ApiResources> & {
      claims?: CreationAttributes<ApiClaims>['type'][];
      scopes?: Array<
        Omit<CreationAttributes<ApiScopes>, 'apiResourceId'> & {
          claims?: CreationAttributes<ApiScopeClaims>['type'][];
        }
      >;
      secrets?: Omit<CreationAttributes<ApiSecrets>, 'apiResourceId'>[];
      properties?: Omit<CreationAttributes<ApiProperties>, 'apiResourceId'>[];
    }
  >;
  identityResources?: Array<
    CreationAttributes<IdentityResources> & {
      claims?: CreationAttributes<IdentityClaims>['type'][];
      properties?: Omit<CreationAttributes<IdentityProperties>, 'identityResourceId'>[];
    }
  >;
  clients?: Array<
    CreationAttributes<Clients> & {
      claims?: Omit<CreationAttributes<ClientClaims>, 'clientId'>[];
      corsOrigins?: CreationAttributes<ClientCorsOrigins>['origin'][];
      scopes?: CreationAttributes<ClientScopes>['scope'][];
      grantTypes?: CreationAttributes<ClientGrantTypes>['grantType'][];
      redirectUris?: CreationAttributes<ClientRedirectUris>['redirectUri'][];
      postLogoutRedirectUris?: CreationAttributes<ClientPostLogoutRedirectUris>['postLogoutRedirectUri'][];
      secrets?: Omit<CreationAttributes<ClientSecrets>, 'clientId'>[];
      properties?: Omit<CreationAttributes<ClientProperties>, 'clientId'>[];
    }
  >;
}
