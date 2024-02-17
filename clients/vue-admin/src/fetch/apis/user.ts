import { defineRegistApi, gql } from '@ace-pomelo/shared-client';
import { request } from '../graphql/infrastructure-request';

// Types
import type { TypedQueryDocumentNode, TypedMutationDocumentNode } from '@ace-pomelo/shared-client';

export enum UserStatus {
  Disabled = 'Disabled',
  Enabled = 'Enabled',
}

export interface UserModel {
  id: string;
  niceName: string;
  displayName: string;
  mobile: string;
  email: string;
  url: string;
  status: UserStatus;
  updatedAt: Date;
}

export const useUserApi = defineRegistApi('user', {
  apis: {
    get: gql`
      query getUser($id: ID!) {
        user(id: $id) {
          id
          niceName
          displayName
          mobile
          email
          url
          status
          updatedAt
        }
      }
    ` as TypedQueryDocumentNode<{ user: UserModel | null }, { id: string }>,
    getMetas: gql`
      query getUserMetas($userId: ID!, $keys: [String!]!) {
        metas: userMetas(userId: $userId, metaKeys: $keys) {
          id
          key: metaKey
          value: metaValue
        }
      }
    ` as TypedQueryDocumentNode<
      { metas: { id: string; key: string; value: string }[] },
      { userId: string; keys: string[] }
    >,
    updateMetaByKey: gql`
      mutation updateUserMetaByKey($userId: ID!, $key: String!, $value: String!) {
        result: updateUserMetaByKey(userId: $userId, metaKey: $key, metaValue: $value)
      }
    ` as TypedMutationDocumentNode<{ result: boolean }, { userId: string; key: string; value: string }>,
  },
  request,
});
