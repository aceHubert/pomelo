import { LRUCache } from 'lru-cache';
import { StorageAdpter } from '../interfaces/storage.adpter';

export class MemeryStorage extends StorageAdpter {
  private readonly storage: LRUCache<string, any>;
  constructor(options?: LRUCache.Options<string, any, any>) {
    super();

    this.storage = new LRUCache<string, any>({ max: Number.MAX_VALUE, ...options });

    this.logger.debug('Use memory cache');
  }

  dispose() {
    this.storage.clear();
  }

  /**
   * Get value from redis
   * @param key Key
   */
  async get<T>(key: string): Promise<T | null | undefined> {
    return await this.storage.get(key);
  }

  /**
   * Set key with value and optional expiration
   * @param key Key
   * @param value Value
   * @param expiresIn expiration in seconds
   */
  async set<T>(key: string, value: T, expiresIn?: number): Promise<void> {
    await this.storage.set(key, this.encode(value), {
      ttl: expiresIn ? expiresIn * 1000 : undefined,
    });
  }

  /**
   * Delete key from redis
   * @param key Key
   */
  async del(key: string): Promise<void> {
    await this.storage.delete(key);
  }
}
