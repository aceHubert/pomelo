import { ModuleMetadata, Type } from '@nestjs/common';

export interface Storage {
  get<T>(key: string): T | null | undefined | Promise<T | null | undefined>;
  set<T>(key: string, value: T, expiresIn?: number): void | Promise<void>;
  del(key: string): void | Promise<void>;
}

export interface AccountOptions {
  /**
   * storage
   */
  storage: Storage;
}

export interface AccountOptionsFactory {
  createAccountOptions(): Promise<AccountOptions> | AccountOptions;
}

export interface AccountAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<AccountOptionsFactory>;
  useClass?: Type<AccountOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<AccountOptions> | AccountOptions;
  inject?: any[];
}
