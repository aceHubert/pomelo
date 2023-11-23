import { ModuleMetadata, Type } from '@nestjs/common';
import { RAMEvaluateMethods } from '../core/RAMEvaluateMethods';

export interface RamAuthorizationOptions {
  /**
   * The name of the RAM authorization olicy. default is 'RAMAuthorizationPolicy'.
   */
  policyName?: string;

  /**
   * The name of the RAM authorization claim type. default is 'ram'.
   */
  ramClaimTypeName?: string;

  /**
   * The name of the protected ApiResource.
   */
  serviceName: string;

  /**
   * Determines which method used to evaluate.
   */
  evaluateMethod?: RAMEvaluateMethods;

  /**
   * Determines what property on `req`
   * @default user.
   */
  userProperty?: string;
}

export interface RamAuthorizationOptionsFactory {
  createRamAuthorizationOptions(): Promise<RamAuthorizationOptions> | RamAuthorizationOptions;
}

export interface RamAuthorizationAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<RamAuthorizationOptionsFactory>;
  useClass?: Type<RamAuthorizationOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<RamAuthorizationOptions> | RamAuthorizationOptions;
  inject?: any[];
}
