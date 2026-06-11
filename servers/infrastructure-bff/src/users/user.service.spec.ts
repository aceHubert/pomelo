import {
  OptionPresetKeys,
  REGISTER_EMAIL_CODE_SCENE,
  UserInputError,
  UserPattern,
  ValidationError,
} from '@ace-pomelo/shared/server';
import { UserService } from './user.service';

describe('UserService registration', () => {
  const createService = (options?: {
    rawOptions?: Record<string, string | undefined>;
    cacheValues?: Record<string, unknown>;
    sendResult?: (pattern: unknown, payload: any) => unknown;
    mailError?: Error;
  }) => {
    const rawOptions: Record<string, string | undefined> = {
      [OptionPresetKeys.AuthRegisterEnable]: '1',
      [OptionPresetKeys.AuthRegisterEmailSuffixes]: 'linux.do',
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
          if (pattern === UserPattern.GetMetas) {
            return [];
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
    const authService = {
      createToken: jest.fn(async () => 'token'),
    };
    const mailService = {
      send: jest.fn(async () => {
        if (options?.mailError) {
          throw options.mailError;
        }
      }),
    };
    const service = new UserService(
      basicService as any,
      { tokenExpiresIn: '1d' },
      authService as any,
      cacheService as any,
      optionService as any,
      mailService as any,
    );

    return {
      service,
      basicService,
      cacheService,
      mailService,
      authService,
    };
  };

  it('rejects register email code when registration is disabled', async () => {
    const { service } = createService({
      rawOptions: {
        [OptionPresetKeys.AuthRegisterEnable]: '0',
      },
    });

    await expect(service.sendRegisterEmailCode({ email: 'user@linux.do' })).rejects.toThrow(UserInputError);
  });

  it('rejects register email code when suffix is not in default suffixes', async () => {
    const { service } = createService({
      rawOptions: {
        [OptionPresetKeys.AuthRegisterEmailSuffixes]: '',
      },
    });

    await expect(service.sendRegisterEmailCode({ email: 'user@linux.do' })).rejects.toThrow(UserInputError);
  });

  it('uses default register email suffixes when suffixes are empty', async () => {
    const { service, mailService } = createService({
      rawOptions: {
        [OptionPresetKeys.AuthRegisterEmailSuffixes]: '',
      },
    });

    await expect(service.sendRegisterEmailCode({ email: 'user@gmail.com' })).resolves.toMatchObject({
      success: true,
    });
    expect(mailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@gmail.com',
      }),
    );
  });

  it('does not cache code when mail sending fails', async () => {
    const { service, cacheService, mailService } = createService({
      mailError: new Error('mail config missing'),
    });

    await expect(service.sendRegisterEmailCode({ email: 'user@linux.do' })).rejects.toThrow('mail config missing');
    expect(mailService.send).toHaveBeenCalled();
    expect(cacheService.set).not.toHaveBeenCalled();
  });

  it('sends register email code with scene mail and caches after send', async () => {
    const { service, cacheService, mailService } = createService();

    await expect(service.sendRegisterEmailCode({ email: 'USER@linux.do' })).resolves.toMatchObject({
      success: true,
      expiresInSeconds: 600,
      cooldownSeconds: 60,
    });
    expect(mailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        scene: REGISTER_EMAIL_CODE_SCENE,
        to: 'user@linux.do',
        variables: expect.objectContaining({
          email: 'user@linux.do',
          expiresInMinutes: 10,
        }),
      }),
    );
    expect(cacheService.set).toHaveBeenCalledWith(
      'auth:register:email-code:user@linux.do',
      expect.objectContaining({
        email: 'user@linux.do',
        code: expect.stringMatching(/^\d{6}$/),
      }),
      600000,
    );
  });

  it('rejects register email code when email already exists', async () => {
    const { service, cacheService, mailService } = createService({
      sendResult: (pattern) => pattern === UserPattern.EmailExists,
    });

    await expect(service.sendRegisterEmailCode({ email: 'user@linux.do' })).rejects.toThrow(ValidationError);
    expect(mailService.send).not.toHaveBeenCalled();
    expect(cacheService.set).not.toHaveBeenCalled();
  });

  it('registers with cached code and returns sign-in compatible token', async () => {
    const { service, basicService, authService } = createService({
      cacheValues: {
        'auth:register:email-code:user@linux.do': {
          email: 'user@linux.do',
          code: '123456',
          expiresAt: Date.now() + 60_000,
        },
      },
    });

    const result = await service.register({
      email: 'user@linux.do',
      code: '123456',
      username: 'newuser',
      password: 'sha256-password',
    });

    expect(result).toMatchObject({
      success: true,
      accessToken: 'token',
      tokenType: 'Bearer',
    });
    expect(basicService.send).toHaveBeenCalledWith(
      UserPattern.AuthCreate,
      expect.objectContaining({
        loginName: 'newuser',
        email: 'user@linux.do',
      }),
    );
    expect(authService.createToken).toHaveBeenCalled();
  });

  it('checks register username availability', async () => {
    const { service } = createService({
      sendResult: (pattern, payload) => {
        if (pattern === UserPattern.LoginNameExists) {
          return payload.loginName === 'taken';
        }
        return false;
      },
    });

    await expect(service.isRegisterUsernameAvailable('newuser')).resolves.toBe(true);
    await expect(service.isRegisterUsernameAvailable('taken')).resolves.toBe(false);
  });

  it('rejects register when cached code is expired', async () => {
    const { service } = createService({
      cacheValues: {
        'auth:register:email-code:user@linux.do': {
          email: 'user@linux.do',
          code: '123456',
          expiresAt: Date.now() - 1,
        },
      },
    });

    await expect(
      service.register({
        email: 'user@linux.do',
        code: '123456',
        username: 'newuser',
        password: 'sha256-password',
      }),
    ).rejects.toThrow(UserInputError);
  });

  it('rejects register when cached code does not match', async () => {
    const { service } = createService({
      cacheValues: {
        'auth:register:email-code:user@linux.do': {
          email: 'user@linux.do',
          code: '123456',
          expiresAt: Date.now() + 60_000,
        },
      },
    });

    await expect(
      service.register({
        email: 'user@linux.do',
        code: '654321',
        username: 'newuser',
        password: 'sha256-password',
      }),
    ).rejects.toThrow(UserInputError);
  });
});
