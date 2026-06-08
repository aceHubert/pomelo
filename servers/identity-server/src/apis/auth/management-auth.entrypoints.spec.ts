import { ManagementAuthController } from './management-auth.controller';
import { ManagementAuthResolver } from './management-auth.resolver';

describe('managementLogin entrypoints', () => {
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

    await expect(new ManagementAuthResolver(service).managementLogin(input)).resolves.toEqual(response);
    await expect(new ManagementAuthController(service).login(input)).resolves.toEqual(response);
    expect(service.login).toHaveBeenNthCalledWith(1, input);
    expect(service.login).toHaveBeenNthCalledWith(2, input);
  });
});
