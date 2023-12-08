import {
  NewClientInput,
  NewClientClaimInput,
  NewClientCorsOriginInput,
  NewClientGrantTypeInput,
  NewClientPostLogoutRedirectUriInput,
  NewClientPropertyInput,
  NewClientRedirectUriInput,
  NewClientScopeInput,
  NewClientSecretInput,
} from './client.interface';
import {
  NewIdentityResourceInput,
  NewIdentityClaimInput,
  NewIdentityPropertyInput,
} from './identity-resource.interface';
import {
  NewApiResourceInput,
  NewApiClaimInput,
  NewApiScopeInput,
  NewApiScopeClaimInput,
  NewApiSecretInput,
  NewApiPropertyInput,
} from './api-resource.interface';

export interface InitArgs {
  apiResources: Array<
    NewApiResourceInput & {
      claims?: NewApiClaimInput['type'][];
      scopes?: Array<
        Omit<NewApiScopeInput, 'apiResourceId'> & {
          claims?: NewApiScopeClaimInput['type'][];
        }
      >;
      secrets?: Omit<NewApiSecretInput, 'apiResourceId'>[];
      properties?: Omit<NewApiPropertyInput, 'apiResourceId'>[];
    }
  >;
  identityResources: Array<
    NewIdentityResourceInput & {
      claims?: NewIdentityClaimInput['type'][];
      properties?: Omit<NewIdentityPropertyInput, 'identityResourceId'>[];
    }
  >;
  clients: Array<
    NewClientInput & {
      claims?: Omit<NewClientClaimInput, 'clientId'>[];
      corsOrigins?: NewClientCorsOriginInput['origin'][];
      scopes?: NewClientScopeInput['scope'][];
      grantTypes?: NewClientGrantTypeInput['grantType'][];
      redirectUris?: NewClientRedirectUriInput['redirectUri'][];
      postLogoutRedirectUris?: NewClientPostLogoutRedirectUriInput['postLogoutRedirectUri'][];
      secrets?: Omit<NewClientSecretInput, 'clientId'>[];
      properties?: Omit<NewClientPropertyInput, 'clientId'>[];
    }
  >;
}
