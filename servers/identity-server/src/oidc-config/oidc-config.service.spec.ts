import { OidcConfigService } from './oidc-config.service';

describe('OidcConfigService management regression', () => {
  function createService() {
    const jwks = {
      keys: [{ kty: 'RSA', kid: 'test-key', use: 'sig', alg: 'RS256', n: 'test', e: 'AQAB' }],
    };
    const accountProviderService = {
      getAccount: jest.fn().mockResolvedValue({ id: 12, login_name: 'root' }),
      getClaims: jest.fn().mockResolvedValue({ role: 'administrator' }),
    };

    const service = new OidcConfigService(
      {
        container: {
          applicationConfig: {
            getGlobalPrefix: () => '',
          },
        },
      } as any,
      {
        debug: true,
        path: '/oidc',
        jwks,
        storage: {
          get: jest.fn(),
          set: jest.fn(),
          del: jest.fn(),
        },
      } as any,
      accountProviderService as any,
      {
        getList: jest.fn().mockResolvedValue([{ name: 'openid', enabled: true, claims: [{ type: 'sub' }] }]),
      } as any,
      {
        get: jest.fn(),
      } as any,
    );

    return { service, jwks, accountProviderService };
  }

  it('保持 OIDC token 签发相关配置不被 management JWT 登录改写', async () => {
    const { service, jwks, accountProviderService } = createService();

    const configuration = (await service.getConfiguration()) as any;

    expect(configuration.jwks).toBe(jwks);
    expect(configuration.routes).toMatchObject({
      authorization: '/connect/authorize',
      token: '/connect/token',
      userinfo: '/connect/userinfo',
      introspection: '/connect/introspect',
      revocation: '/connect/revocation',
    });
    expect(configuration.features.clientCredentials.enabled).toBe(true);
    expect(configuration.features.userinfo.enabled).toBe(true);
    expect(configuration.features.jwtUserinfo.enabled).toBe(true);
    expect(configuration.features.introspection.enabled).toBe(true);
    expect(configuration.features.revocation.enabled).toBe(true);

    expect(configuration.clients[0]).toMatchObject({
      client_id: '00000000-0000-0000-0000-000000000001',
      grant_types: ['client_credentials'],
      token_endpoint_auth_method: 'client_secret_basic',
      access_token_format: 'jwt',
    });
    expect(configuration.ttl.AuthorizationCode(undefined, undefined, { metadata: () => ({}) })).toBe(5 * 60);
    expect(configuration.ttl.IdToken(undefined, undefined, { metadata: () => ({}) })).toBe(60 * 60);
    expect(configuration.ttl.AccessToken(undefined, { resourceServer: undefined })).toBe(60 * 60);
    expect(configuration.ttl.ClientCredentials(undefined, { resourceServer: { accessTokenTTL: 600 } })).toBe(600);

    expect(
      configuration.features.resourceIndicators.getResourceServerInfo(
        { origin: 'https://identity.example.com', protocol: 'https' },
        'https://api.example.com',
        { metadata: () => ({ scope: 'openid profile', access_token_format: 'jwt', access_token_ttl: 600 }) },
      ),
    ).toMatchObject({
      scope: 'openid profile',
      audience: 'https://api.example.com',
      accessTokenFormat: 'jwt',
      accessTokenTTL: 600,
      jwt: { sign: { alg: 'RS256' } },
    });

    await expect(
      configuration.extraTokenClaims(
        { oidc: { account: { accountId: '12' } } },
        { scopes: new Set(['openid', 'profile']) },
      ),
    ).resolves.toEqual({ sub: '12', ram: [] });
    expect(accountProviderService.getAccount).toHaveBeenCalledWith({ id: 12 });
  });
});
