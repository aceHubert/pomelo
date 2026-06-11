jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

import { AuthProvider } from '@ace-pomelo/shared/server';
import { PATH_METADATA } from '@nestjs/common/constants';
import { MailController } from './mail.controller';
import { SocialController } from './social.controller';
import { UserController } from './user.controller';
import { UserResolver } from './user.resolver';

describe('User auth entrypoints', () => {
  const createEntrypoints = () => {
    const userService = {
      sendRegisterEmailCode: jest.fn(async () => ({
        success: true,
        expiresInSeconds: 600,
        cooldownSeconds: 60,
      })),
      register: jest.fn(async () => ({
        success: true,
        accessToken: 'token',
        tokenType: 'Bearer',
        expiresAt: 1,
      })),
    };
    const socialService = {
      startSocialAuth: jest.fn(async () => ({
        provider: AuthProvider.Google,
        authorizationUrl: 'https://accounts.example/authorize',
        state: 'state-1',
      })),
      completeSocialAuth: jest.fn(async () => ({
        success: true,
        accessToken: 'token',
        tokenType: 'Bearer',
        expiresAt: 1,
        returnUrl: '/console',
      })),
    };
    const req = {
      protocol: 'https',
      get: jest.fn((name: string) => (name === 'origin' ? 'https://login.example' : 'login.example')),
    };

    return {
      userService,
      socialService,
      mailController: new MailController(userService as any),
      socialController: new SocialController(socialService as any),
      userController: new UserController({} as any, userService as any),
      resolver: new UserResolver({} as any, userService as any, socialService as any),
      req,
    };
  };

  it('delegates register mail rest and graphql entrypoints to UserService', async () => {
    const { userService, mailController, resolver } = createEntrypoints();
    const emailCodeInput = { email: 'user@linux.do' };

    await expect(mailController.sendRegisterEmailCode(emailCodeInput)).resolves.toMatchObject({
      success: true,
      data: {
        success: true,
      },
    });
    await expect(resolver.sendRegisterEmailCode(emailCodeInput)).resolves.toMatchObject({
      success: true,
    });

    expect(userService.sendRegisterEmailCode).toHaveBeenCalledTimes(2);
    expect(userService.sendRegisterEmailCode).toHaveBeenCalledWith(emailCodeInput);
  });

  it('delegates register user rest and graphql entrypoints to UserService', async () => {
    const { userService, userController, resolver, req } = createEntrypoints();
    const registerInput = {
      email: 'user@linux.do',
      code: '123456',
      username: 'newuser',
      password: 'sha256-password',
    };

    await userController.register(registerInput, req as any);
    await resolver.register(registerInput, req as any);

    expect(userService.register).toHaveBeenCalledTimes(2);
    expect(userService.register).toHaveBeenCalledWith(registerInput, 'https://login.example');
  });

  it('delegates social auth rest and graphql entrypoints to SocialService', async () => {
    const { socialService, socialController, resolver, req } = createEntrypoints();
    const startInput = {
      provider: AuthProvider.Google,
      returnUrl: '/console',
    };
    const completeInput = {
      provider: AuthProvider.Google,
      code: 'code',
      state: 'state-1',
    };

    await expect(socialController.startSocialAuth(startInput, req as any)).resolves.toMatchObject({
      success: true,
      data: {
        provider: AuthProvider.Google,
      },
    });
    await expect(resolver.startSocialAuth(startInput, req as any)).resolves.toMatchObject({
      provider: AuthProvider.Google,
    });
    await socialController.completeSocialAuth(completeInput, req as any);
    await resolver.completeSocialAuth(completeInput, req as any);

    expect(socialService.startSocialAuth).toHaveBeenCalledTimes(2);
    expect(socialService.startSocialAuth).toHaveBeenCalledWith(startInput, 'https://login.example');
    expect(socialService.completeSocialAuth).toHaveBeenCalledTimes(2);
    expect(socialService.completeSocialAuth).toHaveBeenCalledWith(completeInput, 'https://login.example');
  });

  it('mounts social rest entrypoints under SocialController base path', () => {
    expect(Reflect.getMetadata(PATH_METADATA, SocialController)).toBe('api/social');
    expect(Reflect.getMetadata(PATH_METADATA, SocialController.prototype.startSocialAuth)).toBe('oauth/start');
    expect(Reflect.getMetadata(PATH_METADATA, SocialController.prototype.completeSocialAuth)).toBe('oauth/complete');
    expect('startSocialAuth' in UserController.prototype).toBe(false);
    expect('completeSocialAuth' in UserController.prototype).toBe(false);
  });
});
