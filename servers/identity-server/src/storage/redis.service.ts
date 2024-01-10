import { Injectable, Inject, OnModuleInit, OnApplicationShutdown } from '@nestjs/common';
import { jsonSafelyParse } from '@ace-pomelo/shared-server';
import { createClient, RedisClientType } from 'redis';
import { StorageFactory } from './storage.factory';
import { StorageOptions } from './interfaces/storage-options.interface';
import { STORAGE_OPTIONS } from './constants';

@Injectable()
export class RedisService extends StorageFactory implements OnModuleInit, OnApplicationShutdown {
  private readonly storage: RedisClientType;

  constructor(@Inject(STORAGE_OPTIONS) private readonly options: StorageOptions) {
    super();

    if (!options.redis) {
      throw new Error('Redis url not provided');
    }

    this.storage = createClient({
      url: this.options.redis,
    });
  }

  async onModuleInit() {
    this.storage.on('connect', () => {
      this.logger.debug('Redis connected');
    });
    this.storage.on('disconnect', () => {
      this.logger.debug('Redis disconnect');
    });
    this.storage.on('error', (err) => {
      this.logger.error(err);
    });
    await this.storage.connect();
  }

  async onApplicationShutdown() {
    await this.storage.disconnect();
  }

  /**
   * Get value from redis
   * @param key Key
   */
  async get<T>(key: string): Promise<T | null | undefined> {
    return this.decode<T>(await this.storage.get(key));
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

  private encode(payload: any) {
    if (payload === undefined) return payload;

    return JSON.stringify(payload);
  }

  private decode<T = any>(payload: string | null | undefined): T | null | undefined {
    if (payload === null || payload === undefined) return payload;

    return jsonSafelyParse<T>(payload);
  }
}
