import { AppCacheService } from './cache.service';

describe('AppCacheService', () => {
  const createCacheService = (redisUrl = '') => {
    const configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, unknown> = {
          'cache.localTtlMs': 60_000,
          'cache.localMax': 100,
          'cache.redisUrl': redisUrl,
        };
        return values[key];
      }),
    };

    return new AppCacheService(configService as any);
  };

  it('uses memory cache when redis url is not configured', async () => {
    const cacheService = createCacheService();

    expect(cacheService.getStatus()).toMatchObject({
      store: 'memory',
      redisConfigured: false,
    });

    await cacheService.set('auth:test', { code: '123456' }, 60_000);
    await expect(cacheService.get('auth:test')).resolves.toEqual({ code: '123456' });

    await cacheService.del('auth:test');
    await expect(cacheService.get('auth:test')).resolves.toBeUndefined();

    await cacheService.onModuleDestroy();
  });

  const redisIt = process.env.TEST_REDIS_URL ? it : it.skip;

  redisIt('shares register code and oauth state across redis-backed cache instances', async () => {
    const redisUrl = process.env.TEST_REDIS_URL!;
    const firstInstance = createCacheService(redisUrl);
    const secondInstance = createCacheService(redisUrl);
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const registerCodeKey = `auth:register:email-code:redis-${suffix}@linux.do`;
    const oauthStateKey = `auth:oauth:state:${suffix}`;

    expect(firstInstance.getStatus()).toMatchObject({
      store: 'redis',
      redisConfigured: true,
    });
    expect(secondInstance.getStatus()).toMatchObject({
      store: 'redis',
      redisConfigured: true,
    });

    try {
      await firstInstance.set(
        registerCodeKey,
        {
          email: `redis-${suffix}@linux.do`,
          code: '123456',
          expiresAt: Date.now() + 60_000,
        },
        60_000,
      );
      await firstInstance.set(
        oauthStateKey,
        {
          provider: 'google',
          returnUrl: '/console',
          redirectUri: 'https://login.example/auth/oauth/google/callback',
          codeVerifier: 'verifier',
          expiresAt: Date.now() + 60_000,
        },
        60_000,
      );

      await expect(secondInstance.get(registerCodeKey)).resolves.toMatchObject({
        code: '123456',
      });
      await expect(secondInstance.get(oauthStateKey)).resolves.toMatchObject({
        provider: 'google',
        codeVerifier: 'verifier',
      });

      await secondInstance.del(registerCodeKey);
      await secondInstance.del(oauthStateKey);

      await expect(firstInstance.get(registerCodeKey)).resolves.toBeUndefined();
      await expect(firstInstance.get(oauthStateKey)).resolves.toBeUndefined();
    } finally {
      await firstInstance.del(registerCodeKey);
      await firstInstance.del(oauthStateKey);
      await Promise.all([firstInstance.onModuleDestroy(), secondInstance.onModuleDestroy()]);
    }
  });
});
