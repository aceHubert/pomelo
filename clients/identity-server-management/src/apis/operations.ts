import { gql } from '@apollo/client';

export const SIGNIN = gql`
  mutation Signin($input: ManagementLoginInput!) {
    signin(input: $input) {
      accessToken
      tokenType
      expiresIn
      issuedAt
    }
  }
`;

export const CLIENTS = gql`
  query Clients($clientName: String, $offset: Int, $limit: Int) {
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
`;

export const CREATE_CLIENT = gql`
  mutation CreateClient($model: NewClientInput!) {
    createClient(model: $model) {
      clientId
      clientName
      enabled
    }
  }
`;

export const UPDATE_CLIENT = gql`
  mutation UpdateClient($clientId: String!, $model: UpdateClientInput!) {
    updateClient(clientId: $clientId, model: $model)
  }
`;

export const API_RESOURCES = gql`
  query ApiResources($keyword: String, $keywordField: String, $offset: Int, $limit: Int) {
    apiResources(keyword: $keyword, keywordField: $keywordField, offset: $offset, limit: $limit) {
      rows {
        id
        name
        displayName
        enabled
        nonEditable
        updatedAt
        createdAt
      }
      total
    }
  }
`;

export const CREATE_API_RESOURCE = gql`
  mutation CreateApiResource($model: NewApiResourceInput!) {
    createApiResource(model: $model) {
      id
      name
      displayName
      enabled
    }
  }
`;

export const UPDATE_API_RESOURCE = gql`
  mutation UpdateApiResource($id: ID!, $model: UpdateApiResourceInput!) {
    updateApiResource(id: $id, model: $model)
  }
`;

export const DELETE_API_RESOURCE = gql`
  mutation DeleteApiResource($id: ID!) {
    deleteApiResource(id: $id)
  }
`;

export const IDENTITY_RESOURCES = gql`
  query IdentityResources($keyword: String, $keywordField: String, $offset: Int, $limit: Int) {
    identityResources(keyword: $keyword, keywordField: $keywordField, offset: $offset, limit: $limit) {
      rows {
        id
        name
        displayName
        enabled
        nonEditable
        updatedAt
        createdAt
      }
      total
    }
  }
`;

export const CREATE_IDENTITY_RESOURCE = gql`
  mutation CreateIdentityResource($model: NewIdentityResourceInput!) {
    createIdentityResource(model: $model) {
      id
      name
      displayName
      enabled
    }
  }
`;

export const UPDATE_IDENTITY_RESOURCE = gql`
  mutation UpdateIdentityResource($id: ID!, $model: UpdateIdentityResourceInput!) {
    updateIdentityResource(id: $id, model: $model)
  }
`;

export const DELETE_IDENTITY_RESOURCE = gql`
  mutation DeleteIdentityResource($id: ID!) {
    deleteIdentityResource(id: $id)
  }
`;

export const CLIENT_CHILD_OPERATIONS = {
  claims: {
    query: gql`
      query ClientClaims($clientId: String!) {
        clientClaims(clientId: $clientId) {
          claims {
            id
            type
            value
          }
        }
      }
    `,
    create: gql`
      mutation CreateClientClaim($clientId: String!, $model: NewClientClaimInput!) {
        createClientClaim(clientId: $clientId, model: $model) {
          id
          type
          value
        }
      }
    `,
    remove: gql`
      mutation DeleteClientClaim($id: ID!) {
        deleteClientClaim(id: $id)
      }
    `,
  },
  corsOrigins: {
    query: gql`
      query ClientCorsOrigins($clientId: String!) {
        clientCorsOrigins(clientId: $clientId) {
          corsOrigins {
            id
            origin
          }
        }
      }
    `,
    create: gql`
      mutation CreateClientCorsOrigin($clientId: String!, $model: NewClientCorsOriginInput!) {
        createClientCorsOrigin(clientId: $clientId, model: $model) {
          id
          origin
        }
      }
    `,
    remove: gql`
      mutation DeleteClientCorsOrigin($id: ID!) {
        deleteClientCorsOrigin(id: $id)
      }
    `,
  },
  grantTypes: {
    query: gql`
      query ClientGrantTypes($clientId: String!) {
        clientGrantTypes(clientId: $clientId) {
          grantTypes {
            id
            grantType
          }
        }
      }
    `,
    create: gql`
      mutation CreateClientGrantType($clientId: String!, $model: NewClientGrantTypeInput!) {
        createClientGrantType(clientId: $clientId, model: $model) {
          id
          grantType
        }
      }
    `,
    remove: gql`
      mutation DeleteClientGrantType($id: ID!) {
        deleteClientGrantType(id: $id)
      }
    `,
  },
  scopes: {
    query: gql`
      query ClientScopes($clientId: String!) {
        clientScopes(clientId: $clientId) {
          scopes {
            id
            scope
          }
        }
      }
    `,
    create: gql`
      mutation CreateClientScope($clientId: String!, $model: NewClientScopeInput!) {
        createClientScope(clientId: $clientId, model: $model) {
          id
          scope
        }
      }
    `,
    remove: gql`
      mutation DeleteClientScope($id: ID!) {
        deleteClientScope(id: $id)
      }
    `,
  },
  redirectUris: {
    query: gql`
      query ClientRedirectUris($clientId: String!) {
        clientRedirectUris(clientId: $clientId) {
          redirectUris {
            id
            redirectUri
          }
        }
      }
    `,
    create: gql`
      mutation CreateClientRedirectUri($clientId: String!, $model: NewClientRedirectUriInput!) {
        createClientRedirectUri(clientId: $clientId, model: $model) {
          id
          redirectUri
        }
      }
    `,
    remove: gql`
      mutation DeleteClientRedirectUri($id: ID!) {
        deleteClientRedirectUri(id: $id)
      }
    `,
  },
  postLogoutRedirectUris: {
    query: gql`
      query ClientPostLogoutRedirectUris($clientId: String!) {
        clientPostLogoutRedirectUris(clientId: $clientId) {
          postLogoutRedirectUris {
            id
            postLogoutRedirectUri
          }
        }
      }
    `,
    create: gql`
      mutation CreateClientPostLogoutRedirectUri($clientId: String!, $model: NewClientPostLogoutRedirectUriInput!) {
        createClientPostLogoutRedirectUri(clientId: $clientId, model: $model) {
          id
          postLogoutRedirectUri
        }
      }
    `,
    remove: gql`
      mutation DeleteClientPostLogoutRedirectUri($id: ID!) {
        deleteClientPostLogoutRedirectUri(id: $id)
      }
    `,
  },
  secrets: {
    query: gql`
      query ClientSecrets($clientId: String!) {
        clientSecrets(clientId: $clientId) {
          secrets {
            id
            type
            expiresAt
            description
            createdAt
          }
        }
      }
    `,
    create: gql`
      mutation CreateClientSecret($clientId: String!, $model: NewClientSecretInput!) {
        createClientSecret(clientId: $clientId, model: $model) {
          id
          type
          value
          expiresAt
          description
          createdAt
        }
      }
    `,
    remove: gql`
      mutation DeleteClientSecret($id: ID!) {
        deleteClientSecret(id: $id)
      }
    `,
  },
  properties: {
    query: gql`
      query ClientProperties($clientId: String!) {
        clientProperties(clientId: $clientId) {
          properties {
            id
            key
            value
          }
        }
      }
    `,
    create: gql`
      mutation CreateClientProperty($clientId: String!, $model: NewClientPropertyInput!) {
        createClientProperty(clientId: $clientId, model: $model) {
          id
          key
          value
        }
      }
    `,
    remove: gql`
      mutation DeleteClientProperty($id: ID!) {
        deleteClientProperty(id: $id)
      }
    `,
  },
};

export const API_CHILD_OPERATIONS = {
  claims: {
    query: gql`
      query ApiClaims($apiResourceId: ID!) {
        apiClaims(apiResourceId: $apiResourceId) {
          claims {
            id
            type
          }
        }
      }
    `,
    create: gql`
      mutation CreateApiClaim($apiResourceId: ID!, $model: NewApiClaimInput!) {
        createApiClaim(apiResourceId: $apiResourceId, model: $model) {
          id
          type
        }
      }
    `,
    remove: gql`
      mutation DeleteApiClaim($id: ID!) {
        deleteApiClaim(id: $id)
      }
    `,
  },
  scopes: {
    query: gql`
      query ApiScopes($apiResourceId: ID!, $offset: Int, $limit: Int) {
        apiScopes(apiResourceId: $apiResourceId, offset: $offset, limit: $limit) {
          rows {
            id
            apiResourceId
            name
            displayName
          }
          total
        }
      }
    `,
    create: gql`
      mutation CreateApiScope($apiResourceId: ID!, $model: NewApiScopeInput!) {
        createApiScope(apiResourceId: $apiResourceId, model: $model) {
          id
          name
          displayName
        }
      }
    `,
    remove: gql`
      mutation DeleteApiScope($id: ID!) {
        deleteApiScope(id: $id)
      }
    `,
  },
  scopeClaims: {
    query: gql`
      query ApiScopeClaims($apiScopeId: ID!) {
        apiScopeClaims(apiScopeId: $apiScopeId) {
          scopeClaims {
            id
            type
          }
        }
      }
    `,
    create: gql`
      mutation CreateApiScopeClaim($apiScopeId: ID!, $model: NewApiScopeClaimInput!) {
        createApiScopeClaim(apiScopeId: $apiScopeId, model: $model) {
          id
          type
        }
      }
    `,
    remove: gql`
      mutation DeleteApiScopeClaim($id: ID!) {
        deleteApiScopeClaim(id: $id)
      }
    `,
  },
  secrets: {
    query: gql`
      query ApiSecrets($apiResourceId: ID!) {
        apiSecrets(apiResourceId: $apiResourceId) {
          secrets {
            id
            type
            expiresAt
            description
            createdAt
          }
        }
      }
    `,
    create: gql`
      mutation CreateApiSecret($apiResourceId: ID!, $model: NewApiSecretInput!) {
        createApiSecret(apiResourceId: $apiResourceId, model: $model) {
          id
          type
          value
          expiresAt
          description
          createdAt
        }
      }
    `,
    remove: gql`
      mutation DeleteApiSecret($id: ID!) {
        deleteApiSecret(id: $id)
      }
    `,
  },
  properties: {
    query: gql`
      query ApiProperties($apiResourceId: ID!) {
        apiProperties(apiResourceId: $apiResourceId) {
          properties {
            id
            key
            value
          }
        }
      }
    `,
    create: gql`
      mutation CreateApiProperty($apiResourceId: ID!, $model: NewApiPropertyInput!) {
        createApiProperty(apiResourceId: $apiResourceId, model: $model) {
          id
          key
          value
        }
      }
    `,
    remove: gql`
      mutation DeleteApiProperty($id: ID!) {
        deleteApiProperty(id: $id)
      }
    `,
  },
};

export const IDENTITY_CHILD_OPERATIONS = {
  claims: {
    query: gql`
      query IdentityClaims($identityResourceId: ID!) {
        identityClaims(identityResourceId: $identityResourceId) {
          claims {
            id
            type
          }
        }
      }
    `,
    create: gql`
      mutation CreateIdentityClaim($identityResourceId: ID!, $model: NewIdentityClaimInput!) {
        createIdentityClaim(identityResourceId: $identityResourceId, model: $model) {
          id
          type
        }
      }
    `,
    remove: gql`
      mutation DeleteIdentityClaim($id: ID!) {
        deleteIdentityClaim(id: $id)
      }
    `,
  },
  properties: {
    query: gql`
      query IdentityProperties($identityResourceId: ID!) {
        identityProperties(identityResourceId: $identityResourceId) {
          properties {
            id
            key
            value
          }
        }
      }
    `,
    create: gql`
      mutation CreateIdentityProperty($identityResourceId: ID!, $model: NewIdentityPropertyInput!) {
        createIdentityProperty(identityResourceId: $identityResourceId, model: $model) {
          id
          key
          value
        }
      }
    `,
    remove: gql`
      mutation DeleteIdentityProperty($id: ID!) {
        deleteIdentityProperty(id: $id)
      }
    `,
  },
};
