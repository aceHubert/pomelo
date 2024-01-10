import { Logger } from '@nestjs/common';

export abstract class StorageFactory {
  protected readonly logger: Logger;

  constructor() {
    this.logger = new Logger(this.constructor.name, { timestamp: true });
  }

  /**
   * Get value from storage
   * @param key Key
   */
  abstract get<T>(key: string): T | null | undefined | Promise<T | null | undefined>;

  /**
   * Set key with value and optional expiration
   * @param key Key
   * @param value Value
   * @param expiresIn Expiration in seconds
   */
  abstract set<T>(key: string, value: T, expiresIn?: number): void | Promise<void>;

  /**
   * Remove key from storage
   * @param key Key
   */
  abstract del(key: string): void | Promise<void>;
}
