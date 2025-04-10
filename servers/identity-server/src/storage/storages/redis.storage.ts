import { createClient, RedisClientType, RedisClientOptions, RedisModules, RedisFunctions, RedisScripts } from 'redis';
import { StorageAdpter } from '../interfaces/storage.adpter';

export class RedisStorage<
  M extends RedisModules = RedisModules,
  F extends RedisFunctions = RedisFunctions,
  S extends RedisScripts = RedisScripts,
> extends StorageAdpter {
  private readonly storage: RedisClientType<M, F, S>;

  constructor(connection: string | RedisClientOptions<M, F, S>) {
    super();

    this.storage = createClient(typeof connection === 'string' ? { url: connection } : connection);

    this.storage.on('connect', () => {
      this.logger.debug('Redis connected');
    });
    this.storage.on('disconnect', () => {
      this.logger.debug('Redis disconnect');
    });
    this.storage.on('error', (err) => {
      this.logger.error(err);
    });

    this.storage.connect();
  }

  dispose() {
    return this.storage.disconnect();
  }

  /**
   * Get value from redis
   * @param key Key
   */
  async get<T>(key: string): Promise<T | null | undefined> {
    const value = await this.storage.get(key);
    return value ? this.decode<T>(value) : undefined;
  }

  /**
   * Set key with value and optional expiration
   * @param key Key
   * @param value Value
   * @param expiresIn expiration in seconds
   */
  async set<T>(key: string, value: T, expiresIn?: number): Promise<void> {
    await this.storage.set(
      key,
      this.encode(value),
      expiresIn
        ? {
            EX: expiresIn,
          }
        : void 0,
    );
  }

  /**
   * Delete key from redis
   * @param key Key
   */
  async del(key: string): Promise<void> {
    await this.storage.del(key);
  }
}
