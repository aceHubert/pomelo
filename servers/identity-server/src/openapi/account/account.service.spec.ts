import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ManagementAccountService } from './account.service';

describe('ManagementAccountService', () => {
  const createService = (options?: {
    verifyAccount?: jest.Mock;
    getClaims?: jest.Mock;
    createToken?: jest.Mock;
    expiresIn?: string;
  }) => {
    const verifyAccount = options?.verifyAccount ?? jest.fn().mockResolvedValue('1');
    const getClaims =
      options?.getClaims ?? jest.fn().mockResolvedValue({ role: 'administrator', super_administrator: '1' });
    const createToken = options?.createToken ?? jest.fn().mockResolvedValue('signed.jwt');
    const configService = {
      get: jest.fn((key: string, fallback: string) => (key === 'JWT_EXPIRES_IN' ? options?.expiresIn : fallback)),
    };

    return {
      service: new ManagementAccountService(
        { verifyAccount, getClaims } as any,
        { createToken } as any,
        configService as unknown as ConfigService,
      ),
      verifyAccount,
      getClaims,
      createToken,
    };
  };

  it('为超级管理员签发带 RAM 策略的 Bearer JWT', async () => {
    const { service, verifyAccount, getClaims, createToken } = createService({ expiresIn: '30m' });

    const result = await service.login({ username: 'root', password: 'secret' });

    expect(verifyAccount).toHaveBeenCalledWith('root', 'secret');
    expect(getClaims).toHaveBeenCalledWith(1);
    expect(createToken).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: '1',
        role: 'administrator',
        super_administrator: true,
        ram: {
          PolicyName: 'IdentityManagementFullAccess',
          Statements: [{ Effect: 'Allow', Action: ['identity:*'], Resource: ['*'] }],
        },
      }),
      { expiresIn: '30m' },
    );
    expect(result).toEqual({
      accessToken: 'signed.jwt',
      tokenType: 'Bearer',
      expiresIn: '30m',
      issuedAt: expect.any(Number),
    });
  });

  it('拒绝非超级管理员并返回统一认证失败', async () => {
    const { service, createToken } = createService({
      getClaims: jest.fn().mockResolvedValue({ role: 'administrator', super_administrator: '0' }),
    });

    await expect(service.login({ username: 'admin', password: 'secret' })).rejects.toThrow(UnauthorizedException);
    await expect(service.login({ username: 'admin', password: 'secret' })).rejects.toMatchObject({
      message: 'Authentication failed',
    });
    expect(createToken).not.toHaveBeenCalled();
  });

  it('拒绝密码错误并避免暴露账号存在性', async () => {
    const { service, getClaims, createToken } = createService({
      verifyAccount: jest.fn().mockResolvedValue(false),
    });

    await expect(service.login({ username: 'root', password: 'bad' })).rejects.toMatchObject({
      message: 'Authentication failed',
    });
    expect(getClaims).not.toHaveBeenCalled();
    expect(createToken).not.toHaveBeenCalled();
  });
});
