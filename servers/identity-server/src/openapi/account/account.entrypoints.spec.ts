import { ManagementAccountController } from './account.controller';
import { ManagementAccountResolver } from './account.resolver';

describe('signin entrypoints', () => {
  it('GraphQL 与 OpenAPI 登录返回一致结构', async () => {
    const response = {
      accessToken: 'signed.jwt',
      tokenType: 'Bearer',
      expiresIn: '1h',
      issuedAt: 1000,
    };
    const service = {
      login: jest.fn().mockResolvedValue(response),
    } as any;
    const input = { username: 'root', password: 'secret' };

    await expect(new ManagementAccountResolver(service).signin(input)).resolves.toEqual(response);
    await expect(new ManagementAccountController(service).login(input)).resolves.toEqual(response);
    expect(service.login).toHaveBeenNthCalledWith(1, input);
    expect(service.login).toHaveBeenNthCalledWith(2, input);
  });
});
