import { defineRegistGraphql, gql } from '@ace-fetch/graphql-vue';

// Types
import type { TypedMutationDocumentNode } from '@ace-fetch/graphql';

export interface SignInVerifyInput {
  // 用户名
  username: string;
  // 密码
  password: string;
}

export interface SignInVerifySuccessResult {
  // 是否登录成功
  success: true;
  // access token
  accessToken: string;
  // token type
  tokenType: string;
  // 过期时间
  expiresAt: number;
}

export interface SignInVerifyFaildResult {
  // 是否登录成功
  success: false;
  message: string;
}

export interface ModifyPasswordInput {
  // 用户名
  username: string;
  // 旧密码
  oldPwd: string;
  // 新密码
  newPwd: string;
}

export const useLoginApi = defineRegistGraphql('login', {
  definition: {
    signIn: gql`
      mutation signIn($model: SignInInput!) {
        result: signIn(model: $model) {
          success
          accessToken
          tokenType
          expiresAt
          message
        }
      }
    ` as TypedMutationDocumentNode<
      { result: SignInVerifySuccessResult | SignInVerifyFaildResult },
      { model: SignInVerifyInput }
    >,
    modifyPassword: gql`
      mutation updateUserPassword($model: UpdateUserPasswordInput!) {
        result: updateUserPassword(model: $model)
      }
    ` as TypedMutationDocumentNode<{ result: null }, { model: ModifyPasswordInput }>,
  },
});
