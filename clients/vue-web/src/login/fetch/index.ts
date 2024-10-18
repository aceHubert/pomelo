import { defineRegistGraphql, gql } from '@ace-fetch/graphql-vue';

// Types
import type { TypedMutationDocumentNode } from '@ace-fetch/graphql';

export interface UserVerifyInput {
  // 用户名
  username: string;
  // 密码
  password: string;
}

export interface UserVerifySuccessResult {
  // 是否登录成功
  success: true;
  token: string;
}

export interface UserVerifyFaildResult {
  // 是否登录成功
  success: false;
  message: string;
}

export const useLoginApi = defineRegistGraphql('login', {
  definition: {
    signIn: gql`
      mutation signIn($model: VerifyUserInput!) {
        result: signIn(model: $model) {
          success
          token
          message
        }
      }
    ` as TypedMutationDocumentNode<
      { result: UserVerifySuccessResult | UserVerifyFaildResult },
      { model: UserVerifyInput }
    >,
  },
});
