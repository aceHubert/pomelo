import { ModuleMetadata, Type } from '@nestjs/common';

export interface UserOptions {
  /**
   * token expires in seconds
   */
  tokenExpiresIn?: string | number;
  /**
   * is global module
   */
  isGlobal?: boolean;
}

export interface UserOptionsFactory {
  createUserOptions(): Promise<Omit<UserOptions, 'isGlobal'>> | Omit<UserOptions, 'isGlobal'>;
}

export interface UserAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  /**
   * is global module
   */
  isGlobal?: boolean;
  useExisting?: Type<UserOptionsFactory>;
  useClass?: Type<UserOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<Omit<UserOptions, 'isGlobal'>> | Omit<UserOptions, 'isGlobal'>;
  inject?: any[];
}
