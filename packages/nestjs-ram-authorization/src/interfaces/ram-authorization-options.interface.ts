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

  /**
   * is global module
   */
  isGlobal?: boolean;

  /**
   * Allow access when no policies are found for the user.
   * @default false
   */
  allowWhenNoPolicies?: boolean;

  /**
   * Resource URN prefix (pomelo 的首字母缩写).
   * @example 'po' -> 'po:service:resource/id'
   * @example '' or undefined -> 'service:resource/id'
   * @default 'po'
   */
  resourcePrefix?: string;
}

export interface RamAuthorizationOptionsFactory {
  createRamAuthorizationOptions(): Promise<RamAuthorizationOptions> | RamAuthorizationOptions;
}

export interface RamAuthorizationAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  /**
   * is global module
   */
  isGlobal?: boolean;
  useExisting?: Type<RamAuthorizationOptionsFactory>;
  useClass?: Type<RamAuthorizationOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<RamAuthorizationOptions> | RamAuthorizationOptions;
  inject?: any[];
}
