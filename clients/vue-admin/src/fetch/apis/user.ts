import { defineRegistApi, gql } from '../graphql';
import { request } from '../graphql/requests/infrastructure-request';

// Types
import type { TypedQueryDocumentNode, TypedMutationDocumentNode } from '../graphql';

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
    ` as TypedQueryDocumentNode<{ user: UserModel }, { id: string }>,
    updateMetaByKey: gql`
      mutation updateUserMetaByKey($userId: ID!, $key: String!, $value: String!) {
        result: updateUserMetaByKey(userId: $userId, metaKey: $key, metaValue: $value)
      }
    ` as TypedMutationDocumentNode<{ result: boolean }, { userId: number; key: string; value: string }>,
  },
  request,
});
