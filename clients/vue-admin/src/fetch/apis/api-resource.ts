import { defineRegistApi, gql } from '@ace-pomelo/shared-client';
import { request } from '../graphql/identity-request';

// Types
import type { TypedQueryDocumentNode, TypedMutationDocumentNode } from '@ace-pomelo/shared-client';
import type { PagedArgs, Paged } from './types';

export interface ApiResourceModel {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  lastAccessed?: Date;
  nonEditable: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PagedApiResourceArgs extends PagedArgs {
  keyword?: string;
  keywordField?: string;
}

export interface PagedApiResourceModel extends Paged<ApiResourceModel> {}

export interface NewApiResourceInput {
  name: string;
  displayName?: string;
  description?: string;
  nonEditable?: boolean;
  enabled?: boolean;
}

export interface UpdateApiResourceInput extends Partial<NewApiResourceInput> {}

export interface ApiClaimModel {
  id: string;
  type: string;
}

export interface ApiClaimsModel extends Pick<ApiResourceModel, 'id' | 'name' | 'displayName' | 'nonEditable'> {
  claims: ApiClaimModel[];
}

export interface NewApiClaimInput {
  type: string;
}

export interface ApiScopeModel {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  emphasize?: boolean;
  required?: boolean;
  showInDiscoveryDocument?: boolean;
}

export interface PagedApiScopeArgs extends PagedArgs {
  keyword?: string;
  keywordField?: string;
  apiResourceId?: string;
}

export interface PagedApiScopeModel extends Paged<ApiScopeModel> {}

export interface NewApiScopeInput {
  name: string;
  displayName?: string;
  description?: string;
  emphasize?: boolean;
  required?: boolean;
  showInDiscoveryDocument?: boolean;
}

export interface UpdateApiScopeInput extends Partial<NewApiScopeInput> {}

export interface ApiScopeClaimModel {
  id: string;
  type: string;
}

export interface ApiScopeClaimsModel extends Pick<ApiScopeModel, 'id' | 'name' | 'displayName'> {
  scopeClaims: ApiScopeClaimModel[];
}

export interface NewApiScopeClaimInput {
  type: string;
}

export interface ApiSecretModel {
  id: string;
  type: string;
  value: string;
  expiresAt?: number;
  description?: string;
  createdAt: Date;
}

export interface ApiSecretsModel extends Pick<ApiResourceModel, 'id' | 'name' | 'displayName' | 'nonEditable'> {
  secrets: Omit<ApiSecretModel, 'value'>[];
}

export interface NewApiSecretInput {
  type: string;
  expiresAt?: number;
  description?: string;
}

export interface ApiPropertyModel {
  id: string;
  key: string;
  value: string;
}

export interface ApiPropertiesModel extends Pick<ApiResourceModel, 'id' | 'name' | 'displayName' | 'nonEditable'> {
  properties: ApiPropertyModel[];
}

export interface NewApiPropertyInput {
  key: string;
  value: string;
}

export const useApiResourceApi = defineRegistApi('api', {
  apis: {
    getPaged: gql`
      query getApiResources($keyword: String, $keywordField: String, $offset: Int, $limit: Int) {
        apiResources(keyword: $keyword, keywordField: $keywordField, offset: $offset, limit: $limit) {
          rows {
            id
            name
            displayName
            description
            nonEditable
            lastAccessed
            enabled
            updatedAt
          }
          total
        }
      }
    ` as TypedQueryDocumentNode<{ apiResources: PagedApiResourceModel }, PagedApiResourceArgs>,
    get: gql`
      query getApiResource($id: ID!) {
        apiResource(id: $id) {
          id
          name
          displayName
          description
          nonEditable
          lastAccessed
          enabled
          updatedAt
          createdAt
        }
      }
    ` as TypedQueryDocumentNode<{ apiResource: ApiResourceModel | null }, { id: string }>,
    getBasicInfo: gql`
      query getApiResource($id: ID!) {
        apiResource(id: $id) {
          id
          name
          displayName
          enabled
          createdAt
        }
      }
    ` as TypedQueryDocumentNode<
      { apiResource: Pick<ApiResourceModel, 'id' | 'name' | 'displayName' | 'enabled' | 'createdAt'> | null },
      { id: string }
    >,
    create: gql`
      mutation createApiResource($model: NewApiResourceInput!) {
        apiResource: createApiResource(model: $model) {
          id
          name
          displayName
          description
          nonEditable
          lastAccessed
          enabled
          updatedAt
          createdAt
        }
      }
    ` as TypedMutationDocumentNode<{ apiResource: ApiResourceModel }, { model: NewApiResourceInput }>,
    update: gql`
      mutation updateApiResource($id: ID!, $model: UpdateApiResourceInput!) {
        result: updateApiResource(id: $id, model: $model)
      }
    ` as TypedMutationDocumentNode<{ result: null }, { id: string; model: UpdateApiResourceInput }>,
    getClaims: gql`
      query getApiClaims($apiResourceId: ID!) {
        apiClaims(apiResourceId: $apiResourceId) {
          id
          name
          displayName
          claims {
            id
            type
          }
        }
      }
    ` as TypedQueryDocumentNode<{ apiClaims: ApiClaimsModel | null }, { apiResourceId: string }>,
    createClaim: gql`
      mutation createApiClaim($apiResourceId: ID!, $model: NewApiClaimInput!) {
        claim: createApiClaim(apiResourceId: $apiResourceId, model: $model) {
          id
          type
        }
      }
    ` as TypedMutationDocumentNode<{ claim: ApiClaimModel }, { apiResourceId: string; model: NewApiClaimInput }>,
    deleteClaim: gql`
      mutation deleteApiClaim($id: ID!) {
        result: deleteApiClaim(id: $id)
      }
    ` as TypedMutationDocumentNode<{ result: null }, { id: string }>,
    getPagedScope: gql`
      query getApiScopes($keyword: String, $keywordField: String, $apiResourceId: ID, $offset: Int, $limit: Int) {
        apiScopes(
          keyword: $keyword
          keywordField: $keywordField
          apiResourceId: $apiResourceId
          offset: $offset
          limit: $limit
        ) {
          rows {
            id
            name
            displayName
            description
            emphasize
            required
            showInDiscoveryDocument
          }
          total
        }
      }
    ` as TypedQueryDocumentNode<{ apiScopes: PagedApiScopeModel }, PagedApiScopeArgs>,
    createScope: gql`
      mutation createApiScope($apiResourceId: ID!, $model: NewApiScopeInput!) {
        scope: createApiScope(apiResourceId: $apiResourceId, model: $model) {
          id
          name
          displayName
          description
          emphasize
          required
          showInDiscoveryDocument
        }
      }
    ` as TypedMutationDocumentNode<{ scope: ApiScopeModel }, { apiResourceId: string; model: NewApiScopeInput }>,
    updateScope: gql`
      mutation updateApiScope($id: ID!, $model: UpdateApiScopeInput!) {
        result: updateApiScope(id: $id, model: $model)
      }
    ` as TypedMutationDocumentNode<{ result: null }, { id: string; model: UpdateApiScopeInput }>,
    deleteScope: gql`
      mutation deleteApiScope($id: ID!) {
        result: deleteApiScope(id: $id)
      }
    ` as TypedMutationDocumentNode<{ result: null }, { id: string }>,
    getScopeClaims: gql`
      query getApiScopeClaims($apiScopeId: ID!) {
        apiScopeClaims(apiScopeId: $apiScopeId) {
          id
          name
          displayName
          scopeClaims {
            id
            type
          }
        }
      }
    ` as TypedQueryDocumentNode<{ apiScopeClaims: ApiScopeClaimsModel | null }, { apiScopeId: string }>,
    createScopeClaim: gql`
      mutation createApiScopeClaim($apiScopeId: ID!, $model: NewApiScopeClaimInput!) {
        scopeClaim: createApiScopeClaim(apiScopeId: $apiScopeId, model: $model) {
          id
          type
        }
      }
    ` as TypedMutationDocumentNode<
      { scopeClaim: ApiScopeClaimModel },
      { apiScopeId: string; model: NewApiScopeClaimInput }
    >,
    deleteScopeClaim: gql`
      mutation deleteApiScopeClaim($id: ID!) {
        result: deleteApiScopeClaim(id: $id)
      }
    ` as TypedMutationDocumentNode<{ result: null }, { id: string }>,
    getSecrets: gql`
      query getApiSecrets($apiResourceId: ID!) {
        apiSecrets(apiResourceId: $apiResourceId) {
          id
          name
          displayName
          secrets {
            id
            type
            expiresAt
            description
            createdAt
          }
        }
      }
    ` as TypedQueryDocumentNode<{ apiSecrets: ApiSecretsModel | null }, { apiResourceId: string }>,
    createSecret: gql`
      mutation createApiSecret($apiResourceId: ID!, $model: NewApiSecretInput!) {
        apiSecret: createApiSecret(apiResourceId: $apiResourceId, model: $model) {
          id
          type
          value
          expiresAt
          description
          createdAt
        }
      }
    ` as TypedMutationDocumentNode<{ apiSecret: ApiSecretModel }, { apiResourceId: number; model: NewApiSecretInput }>,
    deleteSecret: gql`
      mutation deleteApiSecret($id: ID!) {
        result: deleteApiSecret(id: $id)
      }
    ` as TypedMutationDocumentNode<{ result: null }, { id: number }>,
    getProperties: gql`
      query getApiProperties($apiResourceId: ID!) {
        apiProperties(apiResourceId: $apiResourceId) {
          id
          name
          displayName
          properties {
            id
            key
            value
          }
        }
      }
    ` as TypedQueryDocumentNode<{ apiProperties: ApiPropertiesModel | null }, { apiResourceId: string }>,
    createProperty: gql`
      mutation createApiProperty($apiResourceId: ID!, $model: NewApiPropertyInput!) {
        property: createApiProperty(apiResourceId: $apiResourceId, model: $model) {
          id
          key
          value
        }
      }
    ` as TypedMutationDocumentNode<
      { property: ApiPropertyModel },
      { apiResourceId: string; model: NewApiPropertyInput }
    >,
    deleteProperty: gql`
      mutation deleteApiProperty($id: ID!) {
        result: deleteApiProperty(id: $id)
      }
    ` as TypedMutationDocumentNode<{ result: null }, { id: string }>,
  },
  request,
});
