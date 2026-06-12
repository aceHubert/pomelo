import {
  FORGOT_PASSWORD_EMAIL_CODE_SCENE,
  OptionPresetKeys,
  REGISTER_EMAIL_CODE_SCENE,
  UserInputError,
} from '@ace-pomelo/shared/server';
import { UserMailService } from './mail.service';

describe('UserMailService', () => {
  const createService = (rawOptions?: Record<string, string | undefined>) => {
    const optionService = {
      getMailConfig: jest.fn(async () => ({
        host: 'smtp.example.com',
        port: 587,
        user: 'no-reply@example.com',
        pass: 'secret',
      })),
      getRawValue: jest.fn(async (key: string) => rawOptions?.[key]),
    };
    const service = new UserMailService(optionService as any);

    return {
      service,
      optionService,
    };
  };

  it('renders register email code template with scene variables', async () => {
    const { service } = createService({
      [OptionPresetKeys.BlogName]: 'Pomelo Test',
      [OptionPresetKeys.AuthRegisterEmailTemplate]: JSON.stringify({
        subject: '验证码 {{ code }}',
        text: '邮箱 {{email}} 的验证码是 {{code}}，有效期 {{expiresInMinutes}} 分钟，站点 {{siteName}}。',
        html: '<strong>{{code}}</strong><span>{{siteName}}</span>',
      }),
    });
    const sendSmtp = jest.spyOn(service as any, 'sendSmtp').mockResolvedValue(undefined);

    await service.send({
      scene: REGISTER_EMAIL_CODE_SCENE,
      to: 'user@linux.do',
      variables: {
        code: '123456',
        email: 'user@linux.do',
        expiresInMinutes: 10,
      },
    });

    expect(sendSmtp).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.example.com',
      }),
      {
        to: 'user@linux.do',
        subject: '验证码 123456',
        text: '邮箱 user@linux.do 的验证码是 123456，有效期 10 分钟，站点 Pomelo Test。',
        html: '<strong>123456</strong><span>Pomelo Test</span>',
      },
    );
  });

  it('rejects invalid register email template', async () => {
    const { service } = createService({
      [OptionPresetKeys.AuthRegisterEmailTemplate]: '{}',
    });

    await expect(
      service.send({
        scene: REGISTER_EMAIL_CODE_SCENE,
        to: 'user@linux.do',
        variables: {
          code: '123456',
          email: 'user@linux.do',
          expiresInMinutes: 10,
        },
      }),
    ).rejects.toThrow(UserInputError);
  });

  it('renders forgot password email code template with scene variables', async () => {
    const { service } = createService({
      [OptionPresetKeys.BlogName]: 'Pomelo Test',
      [OptionPresetKeys.AuthForgotPasswordEmailTemplate]: JSON.stringify({
        subject: '重置密码验证码 {{ code }}',
        text: '邮箱 {{email}} 的重置密码验证码是 {{code}}，有效期 {{expiresInMinutes}} 分钟，站点 {{siteName}}。',
      }),
    });
    const sendSmtp = jest.spyOn(service as any, 'sendSmtp').mockResolvedValue(undefined);

    await service.send({
      scene: FORGOT_PASSWORD_EMAIL_CODE_SCENE,
      to: 'user@linux.do',
      variables: {
        code: '123456',
        email: 'user@linux.do',
        expiresInMinutes: 10,
      },
    });

    expect(sendSmtp).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.example.com',
      }),
      {
        to: 'user@linux.do',
        subject: '重置密码验证码 123456',
        text: '邮箱 user@linux.do 的重置密码验证码是 123456，有效期 10 分钟，站点 Pomelo Test。',
        html: undefined,
      },
    );
  });

  it('rejects invalid forgot password email template', async () => {
    const { service } = createService({
      [OptionPresetKeys.AuthForgotPasswordEmailTemplate]: '{}',
    });

    await expect(
      service.send({
        scene: FORGOT_PASSWORD_EMAIL_CODE_SCENE,
        to: 'user@linux.do',
        variables: {
          code: '123456',
          email: 'user@linux.do',
          expiresInMinutes: 10,
        },
      }),
    ).rejects.toThrow(UserInputError);
  });
});
