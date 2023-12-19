import { CreationAttributes } from 'sequelize';
import { default as ApiResources } from '../entities/api-resources.entity';
import { default as ApiClaims } from '../entities/api-claims.entity';
import { default as ApiScopes } from '../entities/api-scopes.entity';
import { default as ApiScopeClaims } from '../entities/api-scope-claims.entity';
import { default as ApiSecrets } from '../entities/api-secrets.entity';
import { default as ApiProperties } from '../entities/api-properties.entity';
import { default as IdentityResources } from '../entities/identity-resources.entity';
import { default as IdentityClaims } from '../entities/identity-claims.entity';
import { default as IdentityProperties } from '../entities/identity-properties.entity';
import { default as Clients } from '../entities/clients.entity';
import { default as ClientClaims } from '../entities/client-claims.entity';
import { default as ClientCorsOrigins } from '../entities/client-cors-origins.entity';
import { default as ClientScopes } from '../entities/client-scopes.entity';
import { default as ClientGrantTypes } from '../entities/client-grant-types.entity';
import { default as ClientRedirectUris } from '../entities/client-redirect-uris.entity';
import { default as ClientPostLogoutRedirectUris } from '../entities/client-post-logout-redirect-uris.entity';
import { default as ClientSecrets } from '../entities/client-secrets.entity';
import { default as ClientProperties } from '../entities/client-properties.entity';

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
