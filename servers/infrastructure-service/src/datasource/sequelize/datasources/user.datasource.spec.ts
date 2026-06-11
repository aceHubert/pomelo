import { AuthProvider, AuthUserMetaPresetKeys, UserRole, UserStatus } from '@ace-pomelo/shared/server';
import { UserMeta, Users } from '../entities';
import { UserDataSource } from './user.datasource';

describe('UserDataSource', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('rejects local login when password is empty', async () => {
    const findOne = jest.spyOn(Users, 'findOne');
    const datasource = new UserDataSource();

    await expect(datasource.verifyUser('github_abc', '')).resolves.toBe(false);
    expect(findOne).not.toHaveBeenCalled();
  });

  it('finds a user by provider subject metadata', async () => {
    const datasource = new UserDataSource();
    const findOne = jest.spyOn(UserMeta, 'findOne').mockResolvedValue({ userId: 10 } as any);
    const getFieldsValue = jest.spyOn(datasource as any, 'getFieldsValue').mockResolvedValue({
      id: 10,
      loginName: 'google_user',
    });

    await expect(datasource.getByAuthProviderSubject(AuthProvider.Google, 'subject-1')).resolves.toMatchObject({
      id: 10,
      loginName: 'google_user',
    });
    expect(findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          metaKey: AuthUserMetaPresetKeys.ProviderSubject,
          metaValue: 'google:subject-1',
        },
      }),
    );
    expect(getFieldsValue).toHaveBeenCalledWith(10, expect.arrayContaining(['loginName', 'email', 'status']));
  });

  it('creates auth user with empty password and provider binding metas', async () => {
    const datasource = new UserDataSource();
    const createUserRecord = jest.spyOn(datasource as any, 'createUserRecord').mockResolvedValue({
      id: 11,
      loginName: 'github_hash',
    });

    await datasource.createForAuth({
      loginName: 'github_hash',
      loginPwd: '',
      niceName: 'github_hash',
      displayName: 'GitHub User',
      email: 'user@linux.do',
      url: '',
      status: UserStatus.Enabled,
      capabilities: UserRole.Subscriber,
      providerBinding: {
        provider: AuthProvider.Github,
        subject: '42',
        profile: {
          login: 'octocat',
        },
      },
    });

    expect(createUserRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        loginPwd: '',
        status: UserStatus.Enabled,
        capabilities: UserRole.Subscriber,
        metas: expect.arrayContaining([
          {
            metaKey: AuthUserMetaPresetKeys.Provider,
            metaValue: AuthProvider.Github,
          },
          {
            metaKey: AuthUserMetaPresetKeys.ProviderSubject,
            metaValue: 'github:42',
          },
          {
            metaKey: AuthUserMetaPresetKeys.ProviderProfile,
            metaValue: JSON.stringify({ login: 'octocat' }),
          },
        ]),
      }),
    );
  });
});
