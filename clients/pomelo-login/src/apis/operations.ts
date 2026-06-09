import { gql } from '@apollo/client';

export type SignInInput = {
  username: string;
  password: string;
};

export type SignInSuccessResult = {
  success: true;
  accessToken: string;
  tokenType: string;
  expiresAt: number;
  message?: string | null;
};

export type SignInFailedResult = {
  success: false;
  message: string;
  accessToken?: never;
  tokenType?: never;
  expiresAt?: never;
};

export type SignInResult = SignInSuccessResult | SignInFailedResult;

export type SignInMutationData = {
  result: SignInResult;
};

export type SignInMutationVariables = {
  model: SignInInput;
};

export const SIGN_IN = gql`
  mutation signIn($model: SignInInput!) {
    result: signIn(model: $model) {
      success
      accessToken
      tokenType
      expiresAt
      message
    }
  }
`;

export type UpdateUserPasswordInput = {
  username: string;
  oldPwd: string;
  newPwd: string;
};

export type UpdateUserPasswordMutationData = {
  result: null;
};

export type UpdateUserPasswordMutationVariables = {
  model: UpdateUserPasswordInput;
};

export const UPDATE_USER_PASSWORD = gql`
  mutation updateUserPassword($model: UpdateUserPasswordInput!) {
    result: updateUserPassword(model: $model)
  }
`;
