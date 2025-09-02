import { defineRegistGraphql, gql } from '@ace-fetch/graphql-vue';

// Types
import type { TypedQueryDocumentNode, TypedMutationDocumentNode } from '@ace-fetch/graphql';

export enum UserStatus {
  Disabled = 'Disabled',
  Enabled = 'Enabled',
}

export interface UserModel {
  id: number;
  niceName: string;
  displayName: string;
  mobile: string;
  email: string;
  url: string;
  status: UserStatus;
  updatedAt: Date;
}

export const useUserApi = defineRegistGraphql('user', {
  definition: {
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
    ` as TypedQueryDocumentNode<{ user: UserModel | null }, { id: number }>,
    getMetas: gql`
      query getUserMetas($userId: ID!, $keys: [String!]!) {
        metas: userMetas(userId: $userId, metaKeys: $keys) {
          id
          key: metaKey
          value: metaValue
        }
      }
    ` as TypedQueryDocumentNode<
      { metas: { id: number; key: string; value: string }[] },
      { userId: number; keys: string[] }
    >,
    updateMetaByKey: gql`
      mutation updateUserMetaByKey($userId: ID!, $key: String!, $value: String!) {
        result: updateUserMetaByKey(userId: $userId, metaKey: $key, metaValue: $value)
      }
    ` as TypedMutationDocumentNode<{ result: null }, { userId: number; key: string; value: string }>,
  },
});
