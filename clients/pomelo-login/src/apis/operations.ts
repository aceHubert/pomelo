import { gql } from '@apollo/client';

export type AuthProvider = 'google' | 'github' | 'linuxdo';
export type GraphqlAuthProvider = 'Google' | 'Github' | 'LinuxDo';

const GRAPHQL_AUTH_PROVIDER_MAP: Record<AuthProvider, GraphqlAuthProvider> = {
  google: 'Google',
  github: 'Github',
  linuxdo: 'LinuxDo',
};

export function toGraphqlAuthProvider(provider: AuthProvider): GraphqlAuthProvider {
  return GRAPHQL_AUTH_PROVIDER_MAP[provider];
}

export type AutoloadOptionsQueryData = {
  result: Record<string, string>;
};

export const AUTOLOAD_OPTIONS = gql`
  query autoloadOptions {
    result: autoloadOptions
  }
`;

export type SignInInput = {
  username: string;
  password: string;
};

export type SignInSuccessResult = {
  success: true;
  accessToken: string;
  tokenType: string;
  expiresAt: number;
  returnUrl?: string | null;
  message?: string | null;
};

export type SignInFailedResult = {
  success: false;
  message: string;
  accessToken?: never;
  tokenType?: never;
  expiresAt?: never;
  returnUrl?: never;
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
      returnUrl
      message
    }
  }
`;

export type RegisterEmailCodeInput = {
  email: string;
};

export type RegisterEmailCodeResult = {
  success: boolean;
  expiresInSeconds: number;
  cooldownSeconds: number;
  message?: string | null;
};

export type RegisterEmailCodeMutationData = {
  result: RegisterEmailCodeResult;
};

export type RegisterEmailCodeMutationVariables = {
  model: RegisterEmailCodeInput;
};

export const SEND_REGISTER_EMAIL_CODE = gql`
  mutation sendRegisterEmailCode($model: RegisterEmailCodeInput!) {
    result: sendRegisterEmailCode(model: $model) {
      success
      expiresInSeconds
      cooldownSeconds
      message
    }
  }
`;

export type RegisterUsernameAvailableQueryData = {
  result: boolean;
};

export type RegisterUsernameAvailableQueryVariables = {
  username: string;
};

export const REGISTER_USERNAME_AVAILABLE = gql`
  query registerUsernameAvailable($username: String!) {
    result: registerUsernameAvailable(username: $username)
  }
`;

export type RegisterInput = {
  email: string;
  code: string;
  username: string;
  password: string;
};

export type RegisterMutationData = {
  result: SignInResult;
};

export type RegisterMutationVariables = {
  model: RegisterInput;
};

export const REGISTER = gql`
  mutation register($model: RegisterInput!) {
    result: register(model: $model) {
      success
      accessToken
      tokenType
      expiresAt
      returnUrl
      message
    }
  }
`;

export type SocialAuthStartInput = {
  provider: GraphqlAuthProvider;
  returnUrl?: string;
};

export type SocialAuthStartResult = {
  provider: GraphqlAuthProvider;
  authorizationUrl: string;
  state: string;
};

export type SocialAuthStartMutationData = {
  result: SocialAuthStartResult;
};

export type SocialAuthStartMutationVariables = {
  model: SocialAuthStartInput;
};

export const START_SOCIAL_AUTH = gql`
  mutation startSocialAuth($model: SocialAuthStartInput!) {
    result: startSocialAuth(model: $model) {
      provider
      authorizationUrl
      state
    }
  }
`;

export type SocialAuthCompleteInput = {
  provider: GraphqlAuthProvider;
  code: string;
  state: string;
};

export type SocialAuthCompleteMutationData = {
  result: SignInResult;
};

export type SocialAuthCompleteMutationVariables = {
  model: SocialAuthCompleteInput;
};

export const COMPLETE_SOCIAL_AUTH = gql`
  mutation completeSocialAuth($model: SocialAuthCompleteInput!) {
    result: completeSocialAuth(model: $model) {
      success
      accessToken
      tokenType
      expiresAt
      returnUrl
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

export type ForgotPasswordEmailCodeInput = {
  username: string;
};

export type ForgotPasswordEmailCodeResult = {
  success: boolean;
  expiresInSeconds: number;
  cooldownSeconds: number;
  maskedEmail: string;
  message?: string | null;
};

export type ForgotPasswordEmailCodeMutationData = {
  result: ForgotPasswordEmailCodeResult;
};

export type ForgotPasswordEmailCodeMutationVariables = {
  model: ForgotPasswordEmailCodeInput;
};

export const SEND_FORGOT_PASSWORD_EMAIL_CODE = gql`
  mutation sendForgotPasswordEmailCode($model: ForgotPasswordEmailCodeInput!) {
    result: sendForgotPasswordEmailCode(model: $model) {
      success
      expiresInSeconds
      cooldownSeconds
      maskedEmail
      message
    }
  }
`;

export type ResetPasswordInput = {
  username: string;
  code: string;
  password: string;
};

export type ResetPasswordResult = {
  success: boolean;
  message?: string | null;
};

export type ResetPasswordMutationData = {
  result: ResetPasswordResult;
};

export type ResetPasswordMutationVariables = {
  model: ResetPasswordInput;
};

export const RESET_PASSWORD = gql`
  mutation resetPassword($model: ResetPasswordInput!) {
    result: resetPassword(model: $model) {
      success
      message
    }
  }
`;
