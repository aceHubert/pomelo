import { createHash, randomBytes, randomInt } from 'crypto';
import { AuthProvider, OptionPresetKeys, UserInputError } from '@ace-pomelo/shared/server';

export type ProviderOptionKeys = {
  enableKey: OptionPresetKeys;
  configKey: OptionPresetKeys;
  loginNamePrefix: string;
  defaultScope: string;
  defaultDiscoveryUrl?: string;
  defaultAuthorizationEndpoint?: string;
  defaultTokenEndpoint?: string;
  defaultUserinfoEndpoint?: string;
  defaultEmailsEndpoint?: string;
};

export type AuthProviderConfig = {
  clientId?: string;
  clientSecret?: string;
  scope?: string;
  discoveryUrl?: string;
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  userinfoEndpoint?: string;
  emailsEndpoint?: string;
  tokenAuthMethod?: 'client_secret_basic' | 'client_secret_post';
  redirectUri?: string;
  callbackUrl?: string;
};

export const DEFAULT_REGISTER_EMAIL_SUFFIXES = [
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'qq.com',
  'foxmail.com',
  '163.com',
  '126.com',
  'icloud.com',
];

export const PROVIDER_OPTION_KEYS: Record<AuthProvider, ProviderOptionKeys> = {
  [AuthProvider.Google]: {
    enableKey: OptionPresetKeys.AuthGoogleEnable,
    configKey: OptionPresetKeys.AuthGoogle,
    loginNamePrefix: 'google',
    defaultScope: 'openid email profile',
    defaultDiscoveryUrl: 'https://accounts.google.com/.well-known/openid-configuration',
  },
  [AuthProvider.Github]: {
    enableKey: OptionPresetKeys.AuthGithubEnable,
    configKey: OptionPresetKeys.AuthGithub,
    loginNamePrefix: 'github',
    defaultScope: 'read:user user:email',
    defaultAuthorizationEndpoint: 'https://github.com/login/oauth/authorize',
    defaultTokenEndpoint: 'https://github.com/login/oauth/access_token',
    defaultUserinfoEndpoint: 'https://api.github.com/user',
    defaultEmailsEndpoint: 'https://api.github.com/user/emails',
  },
  [AuthProvider.LinuxDo]: {
    enableKey: OptionPresetKeys.AuthLinuxDoEnable,
    configKey: OptionPresetKeys.AuthLinuxDo,
    loginNamePrefix: 'linuxdo',
    defaultScope: 'openid email profile',
    defaultDiscoveryUrl: 'https://connect.linux.do/.well-known/openid-configuration',
  },
};

export function parseEmailSuffixes(value: string | undefined, fallback = DEFAULT_REGISTER_EMAIL_SUFFIXES) {
  const suffixes = (value ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase().replace(/^@+/, ''))
    .filter(Boolean);

  return suffixes.length ? suffixes : fallback;
}

export function getEmailSuffix(email: string) {
  return email.trim().toLowerCase().split('@').pop() ?? '';
}

export function assertAllowedEmailSuffix(email: string, suffixes: string[]) {
  if (!suffixes.length) {
    throw new UserInputError('允许注册的邮箱后缀未配置，请联系管理员配置');
  }

  const emailSuffix = getEmailSuffix(email);
  if (!suffixes.includes(emailSuffix)) {
    throw new UserInputError('当前邮箱后缀不允许注册');
  }
}

export function randomDigits(length = 6) {
  const max = 10 ** length;
  return String(randomInt(0, max)).padStart(length, '0');
}

export function randomBase64Url(byteLength = 32) {
  return randomBytes(byteLength).toString('base64url');
}

export function sha256Base64Url(value: string) {
  return createHash('sha256').update(value).digest('base64url');
}

export function hashForLoginName(value: string) {
  return createHash('sha256').update(value).digest('hex').slice(0, 16);
}

export function renderTemplate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(value)),
    template,
  );
}

export function parseProviderConfig(rawValue: string | undefined, provider: AuthProvider): AuthProviderConfig {
  try {
    const parsed = JSON.parse(rawValue || '{}') as AuthProviderConfig;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('invalid object');
    }
    return parsed;
  } catch {
    throw new UserInputError(`${provider} 登录配置不是合法 JSON 对象`);
  }
}

export function requireProviderConfig(config: AuthProviderConfig, provider: AuthProvider) {
  if (!config.clientId) {
    throw new UserInputError(`${provider} 登录配置缺少 clientId`);
  }
  if (!config.clientSecret) {
    throw new UserInputError(`${provider} 登录配置缺少 clientSecret`);
  }
}
