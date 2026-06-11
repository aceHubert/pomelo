import Redis from 'ioredis';
import { CacheManagerStore } from 'cache-manager';

export class RedisCacheStore implements CacheManagerStore {
  readonly name = 'redis';
  private connectPromise?: Promise<void>;

  constructor(private readonly redis: Redis) {}

  private async ensureConnected(): Promise<void> {
    if (this.redis.status === 'ready') {
      return;
    }

    if (!this.connectPromise) {
      this.connectPromise = this.redis.connect().finally(() => {
        this.connectPromise = undefined;
      });
    }

    await this.connectPromise;
  }

  async get(key: string): Promise<unknown> {
    await this.ensureConnected();
    const value = await this.redis.get(key);
    return value === null ? undefined : JSON.parse(value);
  }

  async mget(...keys: string[]): Promise<unknown[]> {
    if (keys.length === 0) {
      return [];
    }

    await this.ensureConnected();
    const values = await this.redis.mget(...keys);
    return values.map((value) => (value === null ? undefined : JSON.parse(value)));
  }

  async set(key: string, value: unknown, ttl?: number): Promise<unknown> {
    if (value === undefined) {
      await this.del(key);
      return value;
    }

    await this.ensureConnected();
    const serialized = JSON.stringify(value);
    if (ttl && ttl > 0) {
      await this.redis.set(key, serialized, 'PX', ttl);
    } else {
      await this.redis.set(key, serialized);
    }

    return value;
  }

  async mset(data: Record<string, unknown>, ttl?: number): Promise<void> {
    await Promise.all(Object.entries(data).map(([key, value]) => this.set(key, value, ttl)));
  }

  async del(key: string): Promise<void> {
    await this.ensureConnected();
    await this.redis.del(key);
  }

  async mdel(...keys: string[]): Promise<void> {
    if (keys.length > 0) {
      await this.ensureConnected();
      await this.redis.del(...keys);
    }
  }

  async ttl(key: string): Promise<number> {
    await this.ensureConnected();
    return this.redis.pttl(key);
  }

  async keys(): Promise<string[]> {
    await this.ensureConnected();
    return this.redis.keys('keyv:*');
  }

  async reset(): Promise<void> {
    const keys = await this.keys();
    await this.mdel(...keys);
  }

  async disconnect(): Promise<void> {
    this.redis.disconnect();
  }
}
