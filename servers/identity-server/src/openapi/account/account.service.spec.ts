import { describe, expect, it, jest } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ManagementAccountService } from './account.service';

describe('ManagementAccountService', () => {
  type MockFn = ReturnType<typeof jest.fn>;

  const mockResolved = (value: unknown) => (jest.fn() as any).mockResolvedValue(value) as MockFn;

  const createService = (options?: {
    verifyAccount?: MockFn;
    getClaims?: MockFn;
    getAccount?: MockFn;
    createToken?: MockFn;
    expiresIn?: string;
  }) => {
    const verifyAccount = options?.verifyAccount ?? mockResolved('1');
    const getClaims = options?.getClaims ?? mockResolved({ role: 'administrator', super_administrator: '1' });
    const getAccount =
      options?.getAccount ??
      mockResolved({
        id: 1,
        login_name: 'admin',
        nice_name: 'Admin',
        display_name: 'Administrator',
        email: 'admin@example.com',
      });
    const createToken = options?.createToken ?? mockResolved('signed.jwt');
    const configService = {
      get: jest.fn((key: string, fallback: string) => (key === 'JWT_EXPIRES_IN' ? options?.expiresIn : fallback)),
    };

    return {
      service: new ManagementAccountService(
        { verifyAccount, getClaims, getAccount } as any,
        { createToken } as any,
        configService as unknown as ConfigService,
      ),
      verifyAccount,
      getClaims,
      getAccount,
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
      getClaims: mockResolved({ role: 'administrator', super_administrator: '0' }),
    });

    await expect(service.login({ username: 'admin', password: 'secret' })).rejects.toThrow(UnauthorizedException);
    await expect(service.login({ username: 'admin', password: 'secret' })).rejects.toMatchObject({
      message: 'Authentication failed',
    });
    expect(createToken).not.toHaveBeenCalled();
  });

  it('拒绝密码错误并避免暴露账号存在性', async () => {
    const { service, getClaims, createToken } = createService({
      verifyAccount: mockResolved(false),
    });

    await expect(service.login({ username: 'root', password: 'bad' })).rejects.toMatchObject({
      message: 'Authentication failed',
    });
    expect(getClaims).not.toHaveBeenCalled();
    expect(createToken).not.toHaveBeenCalled();
  });

  it('通过账号 Provider 返回当前用户基础信息', async () => {
    const { service, getAccount, getClaims } = createService({
      getClaims: mockResolved({ avatar: '/uploads/avatar.png' }),
    });

    await expect(service.getCurrentUser('1')).resolves.toEqual({
      id: 1,
      loginName: 'admin',
      niceName: 'Admin',
      displayName: 'Administrator',
      avatar: '/uploads/avatar.png',
      email: 'admin@example.com',
      mobile: undefined,
      url: undefined,
    });
    expect(getAccount).toHaveBeenCalledWith({ id: 1 });
    expect(getClaims).toHaveBeenCalledWith(1);
  });
});
