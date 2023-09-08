import { ModuleMetadata, Type } from '@nestjs/common';
import { RAMEvaluateMethods } from '../core/RAMEvaluateMethods';

export interface RamAuthorizationOptions {
  /// <summary>
  /// The name of the RAM authorization olicy. default is 'RAMAuthorizationPolicy'.
  /// </summary>
  policyName?: string;

  /// <summary>
  /// The name of the RAM authorization claim type. default is 'ram'.
  /// </summary>
  ramClaimTypeName?: string;

  /// <summary>
  /// The name of the protected ApiResource.
  /// </summary>
  serviceName: string;

  /// <summary>
  /// Determines which method used to evaluate.
  /// </summary>
  evaluateMethod?: RAMEvaluateMethods;
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
