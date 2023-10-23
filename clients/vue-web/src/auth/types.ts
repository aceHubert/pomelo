export interface IFrameWindowParams {
  silentRequestTimeout?: number;
}

export interface RedirectParams {
  useReplaceToNavigate?: boolean;
}

/**
 * @see https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest
 */
export interface SigninRequestArgs {
  // mandatory
  url: string;
  authority: string;
  client_id: string;
  redirect_uri: string;
  response_type: string;
  scope: string;

  // optional
  response_mode?: 'query';
  display?: string;
  prompt?: string;
  max_age?: number;
  ui_locales?: string;
  id_token_hint?: string;
  login_hint?: string;
  acr_values?: string;

  // other
  resource?: string | string[];
  request?: string;
  request_uri?: string;
  request_type?: string;
  extraQueryParams?: Record<string, string | number | boolean>;

  // special
  extraTokenParams?: Record<string, unknown>;
  client_secret?: string;
  skipUserInfo?: boolean;
  disablePKCE?: boolean;
  /** custom "state", which can be used by a caller to have "data" round tripped */
  data?: unknown;
}

/**
 * @see https://openid.net/specs/openid-connect-rpinitiated-1_0.html#RPLogout
 */
export interface SignoutRequestArgs {
  // mandatory
  url: string;

  // optional
  id_token_hint?: string;
  post_logout_redirect_uri?: string;
  extraQueryParams?: Record<string, string | number | boolean>;

  // special
  request_type?: string;
  /** custom "state", which can be used by a caller to have "data" round tripped */
  data?: unknown;
}

export interface CreateSigninRequestArgs
  extends Omit<SigninRequestArgs, 'url' | 'authority' | 'client_id' | 'redirect_uri' | 'response_type' | 'scope'> {
  redirect_uri?: string;
  response_type?: string;
  scope?: string;
}

export type CreateSignoutRequestArgs = Omit<SignoutRequestArgs, 'url'>;

export type ExtraSigninRequestArgs = Pick<
  CreateSigninRequestArgs,
  | 'extraQueryParams'
  | 'extraTokenParams'
  | 'data'
  | 'redirect_uri'
  | 'prompt'
  | 'acr_values'
  | 'login_hint'
  | 'scope'
  | 'max_age'
  | 'ui_locales'
>;

export type ExtraSignoutRequestArgs = Pick<
  CreateSignoutRequestArgs,
  'extraQueryParams' | 'data' | 'id_token_hint' | 'post_logout_redirect_uri'
>;

export type SigninRedirectArgs = RedirectParams & ExtraSigninRequestArgs;

export type SigninSilentArgs = IFrameWindowParams & ExtraSigninRequestArgs;

export type SignoutRedirectArgs = RedirectParams & ExtraSignoutRequestArgs;

export type SigninArgs = SigninRedirectArgs;

export type SignoutArgs = SignoutRedirectArgs;
