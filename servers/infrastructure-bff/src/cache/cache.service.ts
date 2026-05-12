import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCache, KeyvAdapter } from 'cache-manager';
import Redis from 'ioredis';
import { Keyv } from 'keyv';
import { MemoryCacheStore } from './memory.store';
import { RedisCacheStore } from './redis.store';

@Injectable()
export class AppCacheService implements OnModuleDestroy {
  private readonly cache: ReturnType<typeof createCache>;
  private readonly storeType: 'memory' | 'redis';

  constructor(private readonly configService: ConfigService) {
    const ttl = this.configService.get<number>('cache.localTtlMs') ?? 60_000;
    const max = this.configService.get<number>('cache.localMax') ?? 5000;
    const redisUrl = this.configService.get<string>('cache.redisUrl')?.trim();

    if (redisUrl) {
      const redis = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 0,
        enableOfflineQueue: false,
      });

      this.cache = createCache({
        stores: [new Keyv({ store: new KeyvAdapter(new RedisCacheStore(redis)) })],
        ttl,
      });
      this.storeType = 'redis';
      return;
    }

    this.cache = createCache({
      stores: [new Keyv({ store: new KeyvAdapter(new MemoryCacheStore({ max, ttl })) })],
      ttl,
    });
    this.storeType = 'memory';
  }

  getStatus() {
    return {
      store: this.storeType,
      status: 'ready',
      redisConfigured: this.storeType === 'redis',
    };
  }

  async get<T>(key: string): Promise<T | undefined> {
    const value = await this.cache.get<T>(key);
    return value === null ? undefined : value;
  }

  async set<T>(key: string, value: T | undefined, ttl?: number): Promise<void> {
    if (value === undefined) {
      await this.cache.del(key);
      return;
    }

    await this.cache.set(key, value, ttl);
  }

  async onModuleDestroy(): Promise<void> {
    await (this.cache as { disconnect?: () => Promise<void> }).disconnect?.();
  }
}
