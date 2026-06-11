import axios from 'axios';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  AuthProvider,
  INFRASTRUCTURE_SERVICE,
  OptionPresetKeys,
  RuntimeError,
  UserInputError,
  UserPattern,
  UserRole,
  UserStatus,
  ValidationError,
} from '@ace-pomelo/shared/server';
import { AppCacheService } from '@/cache/cache.service';
import { OptionService } from '@/options/option.service';
import { SignInResult } from './models/user.model';
import { UserModel } from './interfaces/user-model.interface';
import { UserService } from './user.service';
import { SocialAuthCompleteInput, SocialAuthStartInput } from './dto/social-auth.input';
import { SocialAuthStartResult } from './models/social-auth.model';
import {
  AuthProviderConfig,
  PROVIDER_OPTION_KEYS,
  hashForLoginName,
  parseProviderConfig,
  randomBase64Url,
  requireProviderConfig,
  sha256Base64Url,
} from './user-auth.utils';

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

type OAuthStateCache = {
  provider: AuthProvider;
  returnUrl?: string;
  redirectUri: string;
  codeVerifier: string;
  expiresAt: number;
};

type OAuthEndpoints = {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userinfoEndpoint: string;
  emailsEndpoint?: string;
};

type ProviderProfile = {
  subject: string;
  email?: string;
  name?: string;
  username?: string;
  avatarUrl?: string;
  raw: Record<string, unknown>;
};

@Injectable()
export class SocialService {
  constructor(
    @Inject(INFRASTRUCTURE_SERVICE) private readonly basicService: ClientProxy,
    private readonly cacheService: AppCacheService,
    private readonly optionService: OptionService,
    private readonly userService: UserService,
  ) {}

  async startSocialAuth(input: SocialAuthStartInput, origin?: string): Promise<SocialAuthStartResult> {
    await this.assertProviderEnabled(input.provider);
    const config = await this.getProviderConfig(input.provider);
    const endpoints = await this.resolveOAuthEndpoints(input.provider, config);
    const state = randomBase64Url();
    const codeVerifier = randomBase64Url(48);
    const redirectUri = this.resolveRedirectUri(input.provider, config, origin);
    await this.cacheService.set<OAuthStateCache>(
      this.getOAuthStateKey(state),
      {
        provider: input.provider,
        returnUrl: input.returnUrl,
        redirectUri,
        codeVerifier,
        expiresAt: Date.now() + OAUTH_STATE_TTL_MS,
      },
      OAUTH_STATE_TTL_MS,
    );

    const authorizationUrl = new URL(endpoints.authorizationEndpoint);
    authorizationUrl.searchParams.set('client_id', config.clientId!);
    authorizationUrl.searchParams.set('redirect_uri', redirectUri);
    authorizationUrl.searchParams.set('response_type', 'code');
    authorizationUrl.searchParams.set('scope', config.scope || PROVIDER_OPTION_KEYS[input.provider].defaultScope);
    authorizationUrl.searchParams.set('state', state);
    authorizationUrl.searchParams.set('code_challenge', sha256Base64Url(codeVerifier));
    authorizationUrl.searchParams.set('code_challenge_method', 'S256');

    return {
      provider: input.provider,
      authorizationUrl: authorizationUrl.toString(),
      state,
    };
  }

  async completeSocialAuth(input: SocialAuthCompleteInput, issuer?: string): Promise<SignInResult> {
    await this.assertProviderEnabled(input.provider);
    const state = await this.cacheService.get<OAuthStateCache>(this.getOAuthStateKey(input.state));
    await this.cacheService.del(this.getOAuthStateKey(input.state));

    if (!state || state.expiresAt < Date.now() || state.provider !== input.provider) {
      throw new UserInputError('OAuth state 无效或已过期');
    }

    const config = await this.getProviderConfig(input.provider);
    const endpoints = await this.resolveOAuthEndpoints(input.provider, config);
    const profile =
      input.provider === AuthProvider.Github
        ? await this.exchangeGithubProfile(input.code, state, config, endpoints)
        : await this.exchangeOidcProfile(input.code, state, config, endpoints);
    const user = await this.findOrCreateProviderUser(input.provider, profile);
    const token = await this.userService.createAccessToken(user, issuer);

    return {
      success: true,
      ...token,
      returnUrl: state.returnUrl,
    };
  }

  private async assertProviderEnabled(provider: AuthProvider) {
    const enabled = await this.optionService.getRawValue(PROVIDER_OPTION_KEYS[provider].enableKey);
    if (enabled !== '1') {
      throw new UserInputError(`${provider} 登录暂未启用`);
    }
  }

  private async getProviderConfig(provider: AuthProvider) {
    const rawValue = await this.optionService.getRawValue(PROVIDER_OPTION_KEYS[provider].configKey);
    const config = parseProviderConfig(rawValue, provider);
    requireProviderConfig(config, provider);
    return config;
  }

  private resolveRedirectUri(provider: AuthProvider, config: AuthProviderConfig, origin?: string) {
    if (config.redirectUri || config.callbackUrl) {
      return this.normalizeRedirectUri(provider, config.redirectUri || config.callbackUrl!);
    }

    const baseOrigin = (origin || '').replace(/\/+$/, '');
    if (!baseOrigin) {
      throw new UserInputError(`${provider} 登录配置缺少 callbackUrl`);
    }

    return `${baseOrigin}/oauth/${provider}/callback`;
  }

  private normalizeRedirectUri(provider: AuthProvider, redirectUri: string) {
    try {
      const url = new URL(redirectUri);
      if (url.pathname === `/auth/oauth/${provider}/callback`) {
        url.pathname = `/oauth/${provider}/callback`;
        return url.toString();
      }
    } catch {
      if (redirectUri === `/auth/oauth/${provider}/callback`) {
        return `/oauth/${provider}/callback`;
      }
    }

    return redirectUri;
  }

  private async resolveOAuthEndpoints(provider: AuthProvider, config: AuthProviderConfig): Promise<OAuthEndpoints> {
    const defaults = PROVIDER_OPTION_KEYS[provider];
    let authorizationEndpoint = config.authorizationEndpoint || defaults.defaultAuthorizationEndpoint;
    let tokenEndpoint = config.tokenEndpoint || defaults.defaultTokenEndpoint;
    let userinfoEndpoint = config.userinfoEndpoint || defaults.defaultUserinfoEndpoint;

    if (
      (!authorizationEndpoint || !tokenEndpoint || !userinfoEndpoint) &&
      (config.discoveryUrl || defaults.defaultDiscoveryUrl)
    ) {
      const discoveryUrl = config.discoveryUrl || defaults.defaultDiscoveryUrl!;
      const { data } = await axios.get<Record<string, string>>(discoveryUrl, { timeout: 10_000 });
      authorizationEndpoint = authorizationEndpoint || data.authorization_endpoint;
      tokenEndpoint = tokenEndpoint || data.token_endpoint;
      userinfoEndpoint = userinfoEndpoint || data.userinfo_endpoint;
    }

    if (!authorizationEndpoint || !tokenEndpoint || !userinfoEndpoint) {
      throw new UserInputError(`${provider} 登录配置不完整`);
    }

    return {
      authorizationEndpoint,
      tokenEndpoint,
      userinfoEndpoint,
      emailsEndpoint: config.emailsEndpoint || defaults.defaultEmailsEndpoint,
    };
  }

  private async exchangeOidcProfile(
    code: string,
    state: OAuthStateCache,
    config: AuthProviderConfig,
    endpoints: OAuthEndpoints,
  ): Promise<ProviderProfile> {
    const token = await this.exchangeToken(code, state, config, endpoints.tokenEndpoint);
    const { data } = await axios.get<Record<string, any>>(endpoints.userinfoEndpoint, {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
      },
      timeout: 10_000,
    });
    const subject = String(data.sub || '');
    if (!subject) {
      throw new RuntimeError('第三方用户信息缺少 subject');
    }

    return {
      subject,
      email: data.email,
      name: data.name || data.preferred_username,
      username: data.preferred_username,
      avatarUrl: data.picture,
      raw: data,
    };
  }

  private async exchangeGithubProfile(
    code: string,
    state: OAuthStateCache,
    config: AuthProviderConfig,
    endpoints: OAuthEndpoints,
  ): Promise<ProviderProfile> {
    const token = await this.exchangeToken(code, state, config, endpoints.tokenEndpoint);
    const { data: user } = await axios.get<Record<string, any>>(endpoints.userinfoEndpoint, {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        Accept: 'application/vnd.github+json',
      },
      timeout: 10_000,
    });
    let email = user.email as string | undefined;
    if (!email && endpoints.emailsEndpoint) {
      const { data: emails } = await axios.get<Array<Record<string, any>>>(endpoints.emailsEndpoint, {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          Accept: 'application/vnd.github+json',
        },
        timeout: 10_000,
      });
      const primaryEmail = emails.find((item) => item.primary && item.verified) || emails.find((item) => item.primary);
      email = primaryEmail?.email;
    }
    const subject = String(user.id || '');
    if (!subject) {
      throw new RuntimeError('GitHub 用户信息缺少 id');
    }

    return {
      subject,
      email,
      name: user.name || user.login,
      username: user.login,
      avatarUrl: user.avatar_url,
      raw: user,
    };
  }

  private async exchangeToken(
    code: string,
    state: OAuthStateCache,
    config: AuthProviderConfig,
    tokenEndpoint: string,
  ): Promise<{ access_token: string }> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: state.redirectUri,
      code_verifier: state.codeVerifier,
    });
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (config.tokenAuthMethod === 'client_secret_basic') {
      headers.Authorization = `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`;
    } else {
      body.set('client_id', config.clientId!);
      body.set('client_secret', config.clientSecret!);
    }

    const { data } = await axios.post<Record<string, any>>(tokenEndpoint, body, {
      headers,
      timeout: 10_000,
    });
    if (!data.access_token) {
      throw new RuntimeError('第三方 token exchange 未返回 access_token');
    }

    return {
      access_token: data.access_token,
    };
  }

  private async findOrCreateProviderUser(provider: AuthProvider, profile: ProviderProfile) {
    const boundUser = await this.basicService
      .send<UserModel | undefined>(UserPattern.GetByAuthProviderSubject, {
        provider,
        subject: profile.subject,
      })
      .lastValue();
    if (boundUser) {
      return boundUser;
    }

    if (profile.email) {
      const emailExists = await this.basicService
        .send<boolean>(UserPattern.EmailExists, { email: profile.email })
        .lastValue();
      if (emailExists) {
        throw new ValidationError('第三方邮箱已被其他用户使用，请联系管理员处理');
      }
    }

    const prefix = PROVIDER_OPTION_KEYS[provider].loginNamePrefix;
    const loginName = `${prefix}_${hashForLoginName(`${provider}:${profile.subject}`)}`;
    const capabilities = await this.getDefaultRole();

    return this.basicService
      .send<UserModel>(UserPattern.AuthCreate, {
        loginName,
        loginPwd: '',
        niceName: profile.username || loginName,
        displayName: profile.name || profile.username || loginName,
        email: profile.email,
        url: '',
        status: UserStatus.Enabled,
        capabilities,
        providerBinding: {
          provider,
          subject: profile.subject,
          profile,
        },
      })
      .lastValue();
  }

  private async getDefaultRole() {
    return (await this.optionService.getRawValue(OptionPresetKeys.DefaultRole)) || UserRole.Subscriber;
  }

  private getOAuthStateKey(state: string) {
    return `auth:oauth:state:${state}`;
  }
}
