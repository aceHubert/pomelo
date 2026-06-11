jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

import {
  AuthProvider,
  OptionPresetKeys,
  UserInputError,
  UserPattern,
  ValidationError,
} from '@ace-pomelo/shared/server';
import { SocialService } from './social.service';

describe('SocialService', () => {
  const createService = (options?: {
    rawOptions?: Record<string, string | undefined>;
    cacheValues?: Record<string, unknown>;
    sendResult?: (pattern: unknown, payload: any) => unknown;
  }) => {
    const rawOptions: Record<string, string | undefined> = {
      [OptionPresetKeys.AuthGoogleEnable]: '1',
      [OptionPresetKeys.AuthGoogle]: JSON.stringify({
        clientId: 'google-client',
        clientSecret: 'google-secret',
        authorizationEndpoint: 'https://accounts.example/authorize',
        tokenEndpoint: 'https://accounts.example/token',
        userinfoEndpoint: 'https://accounts.example/userinfo',
      }),
      [OptionPresetKeys.DefaultRole]: 'subscriber',
      ...options?.rawOptions,
    };
    const cacheValues = options?.cacheValues ?? {};
    const basicService = {
      send: jest.fn((pattern: unknown, payload: any) => ({
        lastValue: jest.fn(async () => {
          if (options?.sendResult) {
            return options.sendResult(pattern, payload);
          }
          if (pattern === UserPattern.EmailExists || pattern === UserPattern.LoginNameExists) {
            return false;
          }
          if (pattern === UserPattern.AuthCreate) {
            return {
              id: 1,
              loginName: payload.loginName,
              niceName: payload.niceName,
              displayName: payload.displayName,
              email: payload.email,
              url: payload.url,
              status: payload.status,
              updatedAt: new Date(),
              createdAt: new Date(),
            };
          }
          return undefined;
        }),
      })),
    };
    const cacheService = {
      get: jest.fn(async (key: string) => cacheValues[key]),
      set: jest.fn(async () => undefined),
      del: jest.fn(async () => undefined),
    };
    const optionService = {
      getRawValue: jest.fn(async (key: string) => rawOptions[key]),
    };
    const userService = {
      createAccessToken: jest.fn(async () => ({
        accessToken: 'token',
        tokenType: 'Bearer',
        expiresAt: 1,
      })),
    };
    const service = new SocialService(
      basicService as any,
      cacheService as any,
      optionService as any,
      userService as any,
    );

    return {
      service,
      basicService,
      cacheService,
      userService,
    };
  };

  it('rejects social start when provider is disabled', async () => {
    const { service } = createService({
      rawOptions: {
        [OptionPresetKeys.AuthGoogleEnable]: '0',
      },
    });

    await expect(service.startSocialAuth({ provider: AuthProvider.Google }, 'https://example.com')).rejects.toThrow(
      UserInputError,
    );
  });

  it('creates oauth state and authorization url on social start', async () => {
    const { service, cacheService } = createService();

    const result = await service.startSocialAuth(
      {
        provider: AuthProvider.Google,
        returnUrl: '/console',
      },
      'https://login.example',
    );

    expect(result.provider).toBe(AuthProvider.Google);
    expect(result.authorizationUrl).toContain('https://accounts.example/authorize');
    expect(result.authorizationUrl).toContain('client_id=google-client');
    expect(result.authorizationUrl).toContain('code_challenge_method=S256');
    expect(cacheService.set).toHaveBeenCalledWith(
      expect.stringMatching(/^auth:oauth:state:/),
      expect.objectContaining({
        provider: AuthProvider.Google,
        returnUrl: '/console',
        redirectUri: 'https://login.example/oauth/google/callback',
        codeVerifier: expect.any(String),
      }),
      600000,
    );
  });

  it('normalizes configured callback path without changing provider path name', async () => {
    const { service, cacheService } = createService({
      rawOptions: {
        [OptionPresetKeys.AuthLinuxDoEnable]: '1',
        [OptionPresetKeys.AuthLinuxDo]: JSON.stringify({
          clientId: 'linuxdo-client',
          clientSecret: 'linuxdo-secret',
          authorizationEndpoint: 'https://connect.example/authorize',
          tokenEndpoint: 'https://connect.example/token',
          userinfoEndpoint: 'https://connect.example/userinfo',
          redirectUri: 'https://login.example/auth/oauth/linuxdo/callback',
        }),
      },
    });

    const result = await service.startSocialAuth({ provider: AuthProvider.LinuxDo }, 'https://ignored.example');

    expect(result.authorizationUrl).toContain(
      `redirect_uri=${encodeURIComponent('https://login.example/oauth/linuxdo/callback')}`,
    );
    expect(cacheService.set).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        provider: AuthProvider.LinuxDo,
        redirectUri: 'https://login.example/oauth/linuxdo/callback',
      }),
      600000,
    );
  });

  it('rejects social complete with invalid state and deletes state key', async () => {
    const { service, cacheService } = createService();

    await expect(
      service.completeSocialAuth({
        provider: AuthProvider.Google,
        code: 'code',
        state: 'missing',
      }),
    ).rejects.toThrow(UserInputError);
    expect(cacheService.del).toHaveBeenCalledWith('auth:oauth:state:missing');
  });

  it('auto creates provider user with empty password and binding metadata', async () => {
    const { service, basicService } = createService({
      cacheValues: {
        'auth:oauth:state:state-1': {
          provider: AuthProvider.Google,
          redirectUri: 'https://example.com/auth/oauth/google/callback',
          codeVerifier: 'verifier',
          expiresAt: Date.now() + 60_000,
        },
      },
      sendResult: (pattern, payload) => {
        if (pattern === UserPattern.GetByAuthProviderSubject) {
          return undefined;
        }
        if (pattern === UserPattern.EmailExists || pattern === UserPattern.LoginNameExists) {
          return false;
        }
        if (pattern === UserPattern.AuthCreate) {
          return {
            id: 2,
            loginName: payload.loginName,
            niceName: payload.niceName,
            displayName: payload.displayName,
            email: payload.email,
            url: payload.url,
            status: payload.status,
            updatedAt: new Date(),
            createdAt: new Date(),
          };
        }
        return undefined;
      },
    });
    jest.spyOn(service as any, 'exchangeOidcProfile').mockResolvedValue({
      subject: 'subject-1',
      email: 'new-user@linux.do',
      username: 'new-user',
      name: 'New User',
      raw: { sub: 'subject-1' },
    });

    await expect(
      service.completeSocialAuth({
        provider: AuthProvider.Google,
        code: 'code',
        state: 'state-1',
      }),
    ).resolves.toMatchObject({
      success: true,
      accessToken: 'token',
    });
    expect(basicService.send).toHaveBeenCalledWith(
      UserPattern.AuthCreate,
      expect.objectContaining({
        loginPwd: '',
        email: 'new-user@linux.do',
        providerBinding: expect.objectContaining({
          provider: AuthProvider.Google,
          subject: 'subject-1',
        }),
      }),
    );
  });

  it('rejects provider email conflict before auto binding', async () => {
    const { service } = createService({
      cacheValues: {
        'auth:oauth:state:state-1': {
          provider: AuthProvider.Google,
          redirectUri: 'https://example.com/auth/oauth/google/callback',
          codeVerifier: 'verifier',
          expiresAt: Date.now() + 60_000,
        },
      },
      sendResult: (pattern) => {
        if (pattern === UserPattern.GetByAuthProviderSubject) {
          return undefined;
        }
        if (pattern === UserPattern.EmailExists) {
          return true;
        }
        return false;
      },
    });
    jest.spyOn(service as any, 'exchangeOidcProfile').mockResolvedValue({
      subject: 'subject-1',
      email: 'user@linux.do',
      raw: {},
    });

    await expect(
      service.completeSocialAuth({
        provider: AuthProvider.Google,
        code: 'code',
        state: 'state-1',
      }),
    ).rejects.toThrow(ValidationError);
  });
});
