import { CacheManagerStore } from 'cache-manager';
import { LRUCache } from 'lru-cache';

export class MemoryCacheStore implements CacheManagerStore {
  readonly name = 'memory';
  private readonly cache: LRUCache<string, any>;

  constructor(options: { max?: number; ttl?: number } = {}) {
    this.cache = new LRUCache<string, any>({
      max: options.max ?? 5000,
      ttl: options.ttl,
    });
  }

  async get(key: string): Promise<unknown> {
    return this.cache.get(key);
  }

  async mget(...keys: string[]): Promise<unknown[]> {
    return keys.map((key) => this.cache.get(key));
  }

  async set(key: string, value: unknown, ttl?: number): Promise<unknown> {
    if (value === undefined) {
      await this.del(key);
      return value;
    }

    this.cache.set(key, value, ttl ? { ttl } : undefined);
    return value;
  }

  async mset(data: Record<string, unknown>, ttl?: number): Promise<void> {
    await Promise.all(Object.entries(data).map(([key, value]) => this.set(key, value, ttl)));
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async mdel(...keys: string[]): Promise<void> {
    keys.forEach((key) => this.cache.delete(key));
  }

  async ttl(key: string): Promise<number> {
    return this.cache.getRemainingTTL(key);
  }

  async keys(): Promise<string[]> {
    return Array.from(this.cache.keys());
  }

  async reset(): Promise<void> {
    this.cache.clear();
  }
}
