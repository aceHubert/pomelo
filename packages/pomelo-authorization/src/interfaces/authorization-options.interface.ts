import { ModuleMetadata, Type } from '@nestjs/common';

export interface AuthorizationOptions {
  /**
   * Determines what property on `req`
   * @default user.
   */
  userProperty?: string;
}

export interface AuthorizationOptionsFactory {
  createAuthorizationOptions(): Promise<AuthorizationOptions> | AuthorizationOptions;
}

export interface AuthorizationAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<AuthorizationOptionsFactory>;
  useClass?: Type<AuthorizationOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<AuthorizationOptions> | AuthorizationOptions;
  inject?: any[];
}
