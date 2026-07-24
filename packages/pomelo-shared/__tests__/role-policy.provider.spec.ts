import { UserRole } from '../src/server/enums';
import { RolePolicyProvider, UserAuthorizationSnapshot } from '../src/server/services/role-policy.provider';

describe('RolePolicyProvider', () => {
  const getPolicy = async (authorization: UserAuthorizationSnapshot) =>
    (await new RolePolicyProvider(async () => authorization).getPolicies({ sub: '7' }))[0];

  it('汇总生成跨服务角色 Statements', async () => {
    expect((await getPolicy({ superAdministrator: '1' })).Statements![0].Action).toEqual(['basic:*', 'identity:*']);
    expect((await getPolicy({ role: UserRole.Editor })).Statements![0].Action).toEqual(['basic:*']);
    expect((await getPolicy({ role: UserRole.Subscriber })).Statements![0].Action).toEqual([
      'basic:taxonomy.category.list',
      'basic:taxonomy.tag.list',
      'basic:taxonomy.list',
      'basic:taxonomy.list.byobjectid',
    ]);
  });

  it('非法 sub 和未知角色不生成策略', async () => {
    const loadAuthorization = jest.fn(async () => ({}));
    const provider = new RolePolicyProvider(loadAuthorization);

    await expect(provider.getPolicies({ sub: 'invalid' })).resolves.toEqual([]);
    expect(loadAuthorization).not.toHaveBeenCalled();
    await expect(provider.getPolicies({ sub: 7 })).resolves.toEqual([]);
  });

  it('授权数据查询失败时不降级放行', async () => {
    const error = new Error('query failed');
    const provider = new RolePolicyProvider(async () => Promise.reject(error));

    await expect(provider.getPolicies({ sub: 7 })).rejects.toBe(error);
  });
});
