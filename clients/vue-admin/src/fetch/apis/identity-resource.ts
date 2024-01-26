import { defineRegistApi, gql } from '@ace-pomelo/shared-client';
import { request } from '../graphql/identity-request';

// Types
import type { TypedQueryDocumentNode, TypedMutationDocumentNode } from '@ace-pomelo/shared-client';
import type { PagedArgs, Paged } from './types';

export interface IdentityResourceModel {
  id: number;
  name: string;
  displayName?: string;
  description?: string;
  emphasize: boolean;
  required: boolean;
  showInDiscoveryDocument: boolean;
  nonEditable: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PagedIdentityResourceArgs extends PagedArgs {
  keyword?: string;
  keywordField?: string;
}

export interface PagedIdentityResourceModel extends Paged<IdentityResourceModel> {}

export interface NewIdentityResourceInput {
  name: string;
  displayName?: string;
  description?: string;
  emphasize?: boolean;
  required?: boolean;
  showInDiscoveryDocument?: boolean;
  nonEditable?: boolean;
  enabled?: boolean;
}

export interface UpdateIdentityResourceInput extends Partial<NewIdentityResourceInput> {}

export interface IdentityClaimModel {
  id: number;
  type: string;
}

export interface IdentityClaimsModel
  extends Pick<IdentityResourceModel, 'id' | 'name' | 'displayName' | 'nonEditable'> {
  claims: IdentityClaimModel[];
}

export interface NewIdentityClaimInput {
  type: string;
}

export interface IdentityPropertyModel {
  id: number;
  key: string;
  value: string;
}

export interface IdentityPropertiesModel extends Pick<IdentityResourceModel, 'id' | 'name' | 'displayName'> {
  properties: IdentityPropertyModel[];
}

export interface NewIdentityPropertyInput {
  key: string;
  value: string;
}

export const useIdentityResourceApi = defineRegistApi('identity_resource', {
  apis: {
    getPaged: gql`
      query getIdentityResources($keyword: String, $keywordField: String, $offset: Int, $limit: Int) {
        identityResources(keyword: $keyword, keywordField: $keywordField, offset: $offset, limit: $limit) {
          rows {
            id
            name
            displayName
            description
            emphasize
            required
            showInDiscoveryDocument
            nonEditable
            enabled
            updatedAt
          }
          total
        }
      }
    ` as TypedQueryDocumentNode<{ identityResources: PagedIdentityResourceModel }, PagedIdentityResourceArgs>,
    get: gql`
      query getIdentityResource($id: ID!) {
        identityResource(id: $id) {
          id
          name
          displayName
          description
          emphasize
          required
          showInDiscoveryDocument
          nonEditable
          enabled
          updatedAt
          createdAt
        }
      }
    ` as TypedQueryDocumentNode<{ identityResource: IdentityResourceModel | null }, { id: number }>,
    create: gql`
      mutation createIdentityResource($model: NewIdentityResourceInput!) {
        identityResource: createIdentityResource(model: $model) {
          id
          name
          displayName
          description
          emphasize
          required
          showInDiscoveryDocument
          nonEditable
          enabled
          updatedAt
          createdAt
        }
      }
    ` as TypedMutationDocumentNode<{ identityResource: IdentityResourceModel }, { model: NewIdentityResourceInput }>,
    update: gql`
      mutation updateIdentityResource($id: ID!, $model: UpdateIdentityResourceInput!) {
        result: updateIdentityResource(id: $id, model: $model)
      }
    ` as TypedMutationDocumentNode<{ result: boolean }, { id: number; model: UpdateIdentityResourceInput }>,
    getClaims: gql`
      query getIdentityClaims($identityResourceId: ID!) {
        identityClaims(identityResourceId: $identityResourceId) {
          id
          name
          displayName
          nonEditable
          claims {
            id
            type
          }
        }
      }
    ` as TypedQueryDocumentNode<{ identityClaims: IdentityClaimsModel | null }, { identityResourceId: number }>,
    createClaim: gql`
      mutation createIdentityClaim($identityResourceId: ID!, $model: NewIdentityClaimInput!) {
        claim: createIdentityClaim(identityResourceId: $identityResourceId, model: $model) {
          id
          type
        }
      }
    ` as TypedMutationDocumentNode<
      { claim: IdentityClaimModel },
      { identityResourceId: number; model: NewIdentityClaimInput }
    >,
    deleteClaim: gql`
      mutation deleteIdentityClaim($id: ID!) {
        result: deleteIdentityClaim(id: $id)
      }
    ` as TypedMutationDocumentNode<{ result: boolean }, { id: number }>,
    getProperties: gql`
      query getIdentityProperties($identityResourceId: ID!) {
        identityProperties(identityResourceId: $identityResourceId) {
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
    ` as TypedQueryDocumentNode<{ identityProperties: IdentityPropertiesModel | null }, { identityResourceId: number }>,
    createProperty: gql`
      mutation createIdentityProperty($identityResourceId: ID!, $model: NewIdentityPropertyInput!) {
        property: createIdentityProperty(identityResourceId: $identityResourceId, model: $model) {
          id
          key
          value
        }
      }
    ` as TypedMutationDocumentNode<
      { property: IdentityPropertyModel },
      { identityResourceId: number; model: NewIdentityPropertyInput }
    >,
    deleteProperty: gql`
      mutation deleteIdentityProperty($id: ID!) {
        result: deleteIdentityProperty(id: $id)
      }
    ` as TypedMutationDocumentNode<{ result: boolean }, { id: number }>,
  },
  request,
});
