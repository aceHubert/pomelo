import { OptionPattern, OptionPresetKeys, RuntimeError, UserRole } from '@ace-pomelo/shared/server';
import { OptionService } from './option.service';

describe('OptionService', () => {
  const createService = (
    values: Record<string, string | undefined>,
    listValues?: Record<string, string | undefined>,
  ) => {
    const basicService = {
      send: jest.fn((pattern: unknown, payload: any) => ({
        lastValue: jest.fn(async () => {
          if (pattern === OptionPattern.GetAutoloads) {
            return values;
          }
          if (pattern === OptionPattern.GetValue) {
            return values[payload.optionName];
          }
          if (pattern === OptionPattern.GetList) {
            return Object.entries(listValues ?? values)
              .filter(([, optionValue]) => optionValue !== undefined)
              .map(([optionName, optionValue]) => ({ optionName, optionValue }));
          }
          return undefined;
        }),
      })),
    };
    const cacheService = {
      get: jest.fn(async () => undefined),
      set: jest.fn(async () => undefined),
      del: jest.fn(async () => undefined),
    };

    return {
      service: new OptionService(basicService as any, cacheService as any),
      basicService,
    };
  };

  it('filters sensitive auth options from anonymous autoload values', async () => {
    const { service } = createService({
      [OptionPresetKeys.AuthRegisterEnable]: '1',
      [OptionPresetKeys.AuthRegisterEmailSuffixes]: 'linux.do',
      [OptionPresetKeys.AuthRegisterEmailTemplate]: '{"subject":"secret","text":"secret"}',
      [OptionPresetKeys.AuthGoogleEnable]: '1',
      [OptionPresetKeys.AuthGoogle]: '{"clientSecret":"google-secret"}',
      [OptionPresetKeys.AuthGithub]: '{"clientSecret":"github-secret"}',
      [OptionPresetKeys.AuthLinuxDo]: '{"clientSecret":"linuxdo-secret"}',
    });

    await expect(service.getAutoloadValues(UserRole.None)).resolves.toEqual({
      [OptionPresetKeys.AuthRegisterEnable]: '1',
      [OptionPresetKeys.AuthRegisterEmailSuffixes]: 'linux.do',
      [OptionPresetKeys.AuthGoogleEnable]: '1',
    });
  });

  it('allows internal raw reads for sensitive provider config', async () => {
    const rawConfig = '{"clientSecret":"google-secret"}';
    const { service } = createService({
      [OptionPresetKeys.AuthGoogle]: rawConfig,
    });

    await expect(service.getRawValue(OptionPresetKeys.AuthGoogle)).resolves.toBe(rawConfig);
    await expect(service.getValue(OptionPresetKeys.AuthGoogle, UserRole.Administrator)).resolves.toBeUndefined();
  });

  it('rejects incomplete mail config with admin guidance', async () => {
    const { service } = createService(
      {},
      {
        [OptionPresetKeys.MailServerUrl]: 'smtp.example.com',
        [OptionPresetKeys.MailServerPort]: '587',
        [OptionPresetKeys.MailServerLogin]: 'no-reply@example.com',
      },
    );

    await expect(service.getMailConfig()).rejects.toThrow(RuntimeError);
    await expect(service.getMailConfig()).rejects.toThrow('邮箱发送配置不完整');
  });
});
