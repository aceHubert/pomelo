import { defineRegistApi, gql } from '@ace-pomelo/shared-client';
import { request } from '../graphql/identity-request';

// Types
import type { TypedQueryDocumentNode, TypedMutationDocumentNode } from '@ace-pomelo/shared-client';
import type { PagedArgs, Paged } from './types';

export interface ClientModel {
  applicationType: string;
  clientId: string;
  clientName: string;
  clientUri?: string;
  defaultMaxAge?: number;
  idTokenSignedResponseAlg?: string;
  initiateLoginUri?: string;
  jwksUri?: string;
  logoUri?: string;
  policyUri?: string;
  requireAuthTime?: boolean;
  sectorIdentifierUri?: string;
  subjectType?: string;
  tokenEndpointAuthMethod?: string;
  idTokenLifetime?: number;
  accessTokenTormat?: string;
  accessTokenLifetime?: number;
  refreshTokenExpiration?: string;
  refreshTokenAbsoluteLifetime?: number;
  refreshTokenSlidingLifetime?: number;
  authorizationCodeLifetime?: number;
  deviceCodeLifetime?: number;
  backchannelAuthenticationRequestLifetime?: number;
  requireConsent?: boolean;
  requirePkce?: boolean;
  enabled: boolean;
  updatedAt: Date;
  createdAt: Date;
}

export interface PagedClientArgs extends PagedArgs {
  clientName?: string;
}

export interface PagedClientModel
  extends Paged<
    Pick<ClientModel, 'applicationType' | 'clientId' | 'clientName' | 'enabled' | 'updatedAt' | 'createdAt'>
  > {}

export interface NewClientInput {
  application: 'web' | 'native';
  clientId: string;
  clientName: string;
  clientUri?: string;
  defaultMaxAge?: number;
  idTokenSignedResponseAlg?: string;
  initiateLoginUri?: string;
  jwksUri?: string;
  logoUri?: string;
  policyUri?: string;
  requireAuthTime?: boolean;
  sectorIdentifierUri?: string;
  subjectType?: string;
  tokenEndpointAuthMethod?: string;
  idTokenLifetime?: number;
  accessTokenTormat?: string;
  accessTokenLifetime?: number;
  refreshTokenExpiration?: string;
  refreshTokenAbsoluteLifetime?: number;
  refreshTokenSlidingLifetime?: number;
  authorizationCodeLifetime?: number;
  deviceCodeLifetime?: number;
  backchannelAuthenticationRequestLifetime?: number;
  requireConsent?: boolean;
  requirePkce?: boolean;
}

export interface UpdateClientInput extends Omit<NewClientInput, 'clientId'> {}

export interface ClientClaimModel {
  id: string;
  type: string;
  value: string;
}

export interface ClientClaimsModel extends Pick<ClientModel, 'clientId' | 'clientName'> {
  claims: ClientClaimModel[];
}

export interface NewClientClaimInput {
  type: string;
  value: string;
}

export interface ClientCorsOriginModel {
  id: string;
  origin: string;
}

export interface ClientCorsOriginsModel extends Pick<ClientModel, 'clientId' | 'clientName'> {
  corsOrigins: ClientCorsOriginModel[];
}

export interface NewClientCorsOriginInput {
  origin: string;
}

export interface ClientScopeModel {
  id: string;
  scope: string;
}

export interface ClientScopesModel extends Pick<ClientModel, 'clientId' | 'clientName'> {
  scopes: ClientScopeModel[];
}

export interface NewClientScopeInput {
  scope: string;
}

export interface ClientGrantTypeModel {
  id: string;
  grantType: string;
}

export interface ClientGrantTypesModel extends Pick<ClientModel, 'clientId' | 'clientName'> {
  grantTypes: ClientGrantTypeModel[];
}

export interface NewClientGrantTypeInput {
  grantType: string;
}

export interface ClientRedirectUriModel {
  id: string;
  redirectUri: string;
}

export interface ClientRedirectUrisModel extends Pick<ClientModel, 'clientId' | 'clientName'> {
  redirectUris: ClientRedirectUriModel[];
}

export interface NewClientRedirectUriInput {
  redirectUri: string;
}

export interface ClientPostLogoutRedirectUriModel {
  id: string;
  postLogoutRedirectUri: string;
}

export interface ClientPostLogoutRedirectUrisModel extends Pick<ClientModel, 'clientId' | 'clientName'> {
  postLogoutRedirectUris: ClientPostLogoutRedirectUriModel[];
}

export interface NewClientPostLogoutRedirectUriInput {
  postLogoutRedirectUri: string;
}

export interface ClientSecretModel {
  id: string;
  type: string;
  value: string;
  expiresAt?: number;
  description?: string;
  createdAt: Date;
}

export interface ClientSecretsModel extends Pick<ClientModel, 'clientId' | 'clientName'> {
  secrets: Omit<ClientSecretModel, 'value'>[];
}

export interface NewClientSecretInput {
  type: string;
  expiresAt?: number;
  description?: string;
}

export interface ClientPropertyModel {
  id: string;
  key: string;
  value: string;
}

export interface ClientPropertiesModel extends Pick<ClientModel, 'clientId' | 'clientName'> {
  properties: ClientPropertyModel[];
}

export interface NewClientPropertyInput {
  key: string;
  value: string;
}

export const useClientApi = defineRegistApi('client', {
  apis: {
    // 获取分页客户端
    getPaged: gql`
      query getClients($clientName: String, $offset: Int, $limit: Int) {
        clients(clientName: $clientName, offset: $offset, limit: $limit) {
          rows {
            applicationType
            clientId
            clientName
            enabled
            updatedAt
            createdAt
          }
          total
        }
      }
    ` as TypedQueryDocumentNode<{ clients: PagedClientModel }, PagedClientArgs>,
    // 获取客户端详情
    get: gql`
      query getClient($clientId: String!) {
        client(clientId: $clientId) {
          applicationType
          clientId
          clientName
          clientUri
          defaultMaxAge
          idTokenSignedResponseAlg
          initiateLoginUri
          jwksUri
          logoUri
          policyUri
          requireAuthTime
          sectorIdentifierUri
          subjectType
          tokenEndpointAuthMethod
          idTokenLifetime
          accessTokenTormat
          accessTokenLifetime
          refreshTokenExpiration
          refreshTokenAbsoluteLifetime
          refreshTokenSlidingLifetime
          authorizationCodeLifetime
          deviceCodeLifetime
          backchannelAuthenticationRequestLifetime
          requireConsent
          requirePkce
          enabled
          updatedAt
          createdAt
        }
      }
    ` as TypedQueryDocumentNode<{ client: ClientModel | null }, { clientId: string }>,
    getBasicInfo: gql`
      query getClient($clientId: String!) {
        client(clientId: $clientId) {
          applicationType
          clientId
          clientName
          enabled
          createdAt
        }
      }
    ` as TypedQueryDocumentNode<
      { client: Pick<ClientModel, 'applicationType' | 'clientId' | 'clientName' | 'enabled' | 'createdAt'> | null },
      { clientId: string }
    >,
    create: gql`
      mutation createClient($model: NewClientInput!) {
        client: createClient(model: $model) {
          applicationType
          clientId
          clientName
          enabled
          updatedAt
          createdAt
        }
      }
    ` as TypedMutationDocumentNode<{ client: ClientModel }, { model: NewClientInput }>,
    update: gql`
      mutation updateClient($clientId: String!, $model: UpdateClientInput!) {
        result: updateClient(clientId: $clientId, model: $model)
      }
    ` as TypedMutationDocumentNode<{ result: boolean }, { clientId: string; model: UpdateClientInput }>,
    getCorsOrigins: gql`
      query getClientCorsOrigins($clientId: String!) {
        clientCorsOrigins(clientId: $clientId) {
          clientId
          clientName
          corsOrigins {
            id
            origin
          }
        }
      }
    ` as TypedQueryDocumentNode<{ clientCorsOrigins: ClientCorsOriginsModel | undefined }, { clientId: string }>,
    createCorsOrigin: gql`
      mutation createClientCorsOrigin($clientId: String!, $model: NewClientCorsOriginInput!) {
        corsOrigin: createClientCorsOrigin(clientId: $clientId, model: $model) {
          id
          origin
        }
      }
    ` as TypedMutationDocumentNode<
      { corsOrigin: ClientCorsOriginModel },
      { clientId: string; model: NewClientCorsOriginInput }
    >,
    createCorsOrigins: gql`
      mutation createClientCorsOrigins($clientId: String!, $model: [NewClientCorsOriginInput!]!) {
        corsOrigins: createClientCorsOrigin(clientId: $clientId, model: $model) {
          id
          origin
        }
      }
    ` as TypedMutationDocumentNode<
      { corsOrigins: ClientCorsOriginModel[] },
      { clientId: string; model: NewClientCorsOriginInput[] }
    >,
    deleteCorsOrigin: gql`
      mutation deleteClientCorsOrigin($id: ID!) {
        result: deleteClientCorsOrigin(id: $id)
      }
    ` as TypedMutationDocumentNode<{ result: boolean }, { id: string }>,
    getClaims: gql`
      query getClientClaims($clientId: String!) {
        clientClaims(clientId: $clientId) {
          clientId
          clientName
          claims {
            id
            type
            value
          }
        }
      }
    ` as TypedQueryDocumentNode<{ clientClaims: ClientClaimsModel | null }, { clientId: string }>,
    createClaim: gql`
      mutation createClientClaim($clientId: String!, $model: NewClientClaimInput!) {
        claim: createClientClaim(clientId: $clientId, model: $model) {
          id
          type
          value
        }
      }
    ` as TypedMutationDocumentNode<{ claim: ClientClaimModel }, { clientId: string; model: NewClientClaimInput }>,
    createClaims: gql`
      mutation createClientClaims($clientId: String!, $model: [NewClientClaimInput!]!) {
        claims: createClientClaims(clientId: $clientId, model: $model) {
          id
          type
          value
        }
      }
    ` as TypedMutationDocumentNode<{ claims: ClientClaimModel[] }, { clientId: string; model: NewClientClaimInput[] }>,
    deleteClaim: gql`
      mutation deleteClientClaim($id: ID!) {
        result: deleteClientClaim(id: $id)
      }
    ` as TypedMutationDocumentNode<{ result: boolean }, { id: string }>,
    getGrantTypes: gql`
      query getClientGrantTypes($clientId: String!) {
        clientGrantTypes(clientId: $clientId) {
          clientId
          clientName
          grantTypes {
            id
            grantType
          }
        }
      }
    ` as TypedQueryDocumentNode<{ clientGrantTypes: ClientGrantTypesModel | null }, { clientId: string }>,
    createGrantType: gql`
      mutation createClientGrantType($clientId: String!, $model: NewClientGrantTypeInput!) {
        grantType: createClientGrantType(clientId: $clientId, model: $model) {
          id
          grantType
        }
      }
    ` as TypedMutationDocumentNode<
      { grantType: ClientGrantTypeModel },
      { clientId: string; model: NewClientGrantTypeInput }
    >,
    createGrantTypes: gql`
      mutation createClientGrantTypes($clientId: String!, $model: [NewClientGrantTypeInput!]!) {
        grantTypes: createClientGrantTypes(clientId: $clientId, model: $model) {
          id
          grantType
        }
      }
    ` as TypedMutationDocumentNode<
      { grantTypes: ClientGrantTypeModel[] },
      { clientId: string; model: NewClientGrantTypeInput[] }
    >,
    deleteGrantType: gql`
      mutation deleteClientGrantType($id: ID!) {
        result: deleteClientGrantType(id: $id)
      }
    ` as TypedMutationDocumentNode<{ result: boolean }, { id: string }>,
    getScopes: gql`
      query getClientScopes($clientId: String!) {
        clientScopes(clientId: $clientId) {
          clientId
          clientName
          scopes {
            id
            scope
          }
        }
      }
    ` as TypedQueryDocumentNode<{ clientScopes: ClientScopesModel | null }, { clientId: string }>,
    createScope: gql`
      mutation createClientScope($clientId: String!, $model: NewClientScopeInput!) {
        scope: createClientScope(clientId: $clientId, model: $model) {
          id
          scope
        }
      }
    ` as TypedMutationDocumentNode<{ scope: ClientScopeModel }, { clientId: string; model: NewClientScopeInput }>,
    createScopes: gql`
      mutation createClientScopes($clientId: String!, $model: [NewClientScopeInput!]!) {
        scopes: createClientScopes(clientId: $clientId, model: $model) {
          id
          scope
        }
      }
    ` as TypedMutationDocumentNode<{ scopes: ClientScopeModel[] }, { clientId: string; model: NewClientScopeInput[] }>,
    deleteScope: gql`
      mutation deleteClientScope($id: ID!) {
        result: deleteClientScope(id: $id)
      }
    ` as TypedMutationDocumentNode<{ result: boolean }, { id: string }>,
    getRedirectUris: gql`
      query getClientRedirectUris($clientId: String!) {
        clientRedirectUris(clientId: $clientId) {
          clientId
          clientName
          redirectUris {
            id
            redirectUri
          }
        }
      }
    ` as TypedQueryDocumentNode<{ clientRedirectUris: ClientRedirectUrisModel | null }, { clientId: string }>,
    createRedirectUri: gql`
      mutation createClientRedirectUri($clientId: String!, $model: NewClientRedirectUriInput!) {
        redirectUri: createClientRedirectUri(clientId: $clientId, model: $model) {
          id
          redirectUri
        }
      }
    ` as TypedMutationDocumentNode<
      { redirectUri: ClientRedirectUriModel },
      { clientId: string; model: NewClientRedirectUriInput }
    >,
    createRedirectUris: gql`
      mutation createClientRedirectUris($clientId: String!, $model: [NewClientRedirectUriInput!]!) {
        redirectUris: createClientRedirectUris(clientId: $clientId, model: $model) {
          id
          redirectUri
        }
      }
    ` as TypedMutationDocumentNode<
      { redirectUris: ClientRedirectUriModel[] },
      { clientId: string; model: NewClientRedirectUriInput[] }
    >,
    deleteRedirectUri: gql`
      mutation deleteClientRedirectUri($id: ID!) {
        result: deleteClientRedirectUri(id: $id)
      }
    ` as TypedMutationDocumentNode<{ result: boolean }, { id: string }>,
    getPostLogoutRedirectUris: gql`
      query getClientPostLogoutRedirectUris($clientId: String!) {
        clientPostLogoutRedirectUris(clientId: $clientId) {
          clientId
          clientName
          postLogoutRedirectUris {
            id
            postLogoutRedirectUri
          }
        }
      }
    ` as TypedQueryDocumentNode<
      { clientPostLogoutRedirectUris: ClientPostLogoutRedirectUrisModel | null },
      { clientId: string }
    >,
    createPostLogoutRedirectUri: gql`
      mutation createClientPostLogoutRedirectUri($clientId: String!, $model: NewClientPostLogoutRedirectUriInput!) {
        postLogoutRedirectUri: createClientPostLogoutRedirectUri(clientId: $clientId, model: $model) {
          id
          postLogoutRedirectUri
        }
      }
    ` as TypedMutationDocumentNode<
      { postLogoutRedirectUri: ClientPostLogoutRedirectUriModel },
      { clientId: string; model: NewClientPostLogoutRedirectUriInput }
    >,
    createPostLogoutRedirectUris: gql`
      mutation createClientPostLogoutRedirectUris($clientId: String!, $model: [NewClientPostLogoutRedirectUriInput!]!) {
        postLogoutRedirectUris: createClientPostLogoutRedirectUris(clientId: $clientId, model: $model) {
          id
          postLogoutRedirectUri
        }
      }
    ` as TypedMutationDocumentNode<
      { postLogoutRedirectUris: ClientPostLogoutRedirectUriModel[] },
      { clientId: string; model: NewClientPostLogoutRedirectUriInput[] }
    >,
    deletePostLogoutRedirectUri: gql`
      mutation deleteClientPostLogoutRedirectUri($id: ID!) {
        result: deleteClientPostLogoutRedirectUri(id: $id)
      }
    ` as TypedMutationDocumentNode<{ result: boolean }, { id: string }>,
    getSecrets: gql`
      query getClientSecrets($clientId: String!) {
        clientSecrets(clientId: $clientId) {
          clientId
          clientName
          secrets {
            id
            type
            expiresAt
            description
            createdAt
          }
        }
      }
    ` as TypedQueryDocumentNode<{ clientSecrets: ClientSecretsModel | null }, { clientId: string }>,
    createSecret: gql`
      mutation createClientSecret($clientId: String!, $model: NewClientSecretInput!) {
        clientSecret: createClientSecret(clientId: $clientId, model: $model) {
          id
          type
          value
          expiresAt
          description
          createdAt
        }
      }
    ` as TypedMutationDocumentNode<
      { clientSecret: ClientSecretModel },
      { clientId: string; model: NewClientSecretInput }
    >,
    deleteSecret: gql`
      mutation deleteClientSecret($id: ID!) {
        result: deleteClientSecret(id: $id)
      }
    ` as TypedMutationDocumentNode<{ result: boolean }, { id: string }>,
    getProperties: gql`
      query getClientProperties($clientId: String!) {
        clientProperties(clientId: $clientId) {
          clientId
          clientName
          properties {
            id
            key
            value
          }
        }
      }
    ` as TypedQueryDocumentNode<{ clientProperties: ClientPropertiesModel | null }, { clientId: string }>,
    createProperty: gql`
      mutation createClientProperty($clientId: String!, $model: NewClientPropertyInput!) {
        clientProperty: createClientProperty(clientId: $clientId, model: $model) {
          id
          key
          value
        }
      }
    ` as TypedMutationDocumentNode<
      { clientProperty: ClientPropertyModel },
      { clientId: string; model: NewClientPropertyInput }
    >,
    createProperties: gql`
      mutation createClientProperties($clientId: String!, $model: [NewClientPropertyInput!]!) {
        clientProperties: createClientProperties(clientId: $clientId, model: $model) {
          id
          key
          value
        }
      }
    ` as TypedMutationDocumentNode<
      { clientProperty: ClientPropertyModel[] },
      { clientId: string; model: NewClientPropertyInput[] }
    >,
    deleteProperty: gql`
      mutation deleteClientProperty($id: ID!) {
        result: deleteClientProperty(id: $id)
      }
    ` as TypedMutationDocumentNode<{ result: boolean }, { id: string }>,
  },
  request,
});
