import { defineRegistApi, gql } from '../graphql';

// Types
import type { TypedQueryDocumentNode } from '../graphql';

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

export const useUserApi = defineRegistApi('use', {
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
});
