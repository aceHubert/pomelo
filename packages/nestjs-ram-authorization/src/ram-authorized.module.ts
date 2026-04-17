import { Module, DynamicModule, Provider } from '@nestjs/common';

import { RAMEvaluateMethods } from './core/RAMEvaluateMethods';
import { RAMAuthorizationEvaluator } from './core/RAMAuthorizationEvaluator';
import { RamResourceQueryHelper } from './helpers/ram-resource-query.helper';
import {
  RamAuthorizationOptions,
  RamAuthorizationAsyncOptions,
  RamAuthorizationOptionsFactory,
} from './interfaces/ram-authorization-options.interface';
import { RAM_AUTHORIZATION_OPTIONS, RAM_POLICY_PROVIDERS } from './constants';
import { JwtClaimsPolicyProvider } from './providers/jwt-claims-policy.provider';
import { CompositePolicyProvider } from './providers/composite-policy.provider';
import { RamResourceFilterInterceptor } from './interceptors/ram-resource-filter.interceptor';
import { DEFAULT_RESOURCE_PREFIX } from './utils/resource-matcher';

const DefaultRamAuthorizationOptions: Partial<RamAuthorizationOptions> = {
  policyName: 'RAMAuthorizationPolicy',
  ramClaimTypeName: 'ram',
  evaluateMethod: RAMEvaluateMethods.Statement,
  userProperty: 'user',
  allowWhenNoPolicies: false,
  resourcePrefix: DEFAULT_RESOURCE_PREFIX,
};

@Module({})
export class RamAuthorizationModule {
  static forRoot({ isGlobal, ...options }: RamAuthorizationOptions): DynamicModule {
    options = { ...DefaultRamAuthorizationOptions, ...options };
    this.assertOptions(options);

    return {
      module: RamAuthorizationModule,
      global: isGlobal,
      providers: [
        {
          provide: RAM_AUTHORIZATION_OPTIONS,
          useValue: options,
        },
        {
          provide: RAM_POLICY_PROVIDERS,
          useFactory: () => [new JwtClaimsPolicyProvider(options.ramClaimTypeName)],
        },
        CompositePolicyProvider,
        RAMAuthorizationEvaluator,
        RamResourceFilterInterceptor,
        RamResourceQueryHelper,
      ],
      exports: [
        RAM_AUTHORIZATION_OPTIONS,
        RAM_POLICY_PROVIDERS,
        CompositePolicyProvider,
        RAMAuthorizationEvaluator,
        RamResourceFilterInterceptor,
        RamResourceQueryHelper,
      ],
    };
  }

  static forRootAsync(options: RamAuthorizationAsyncOptions): DynamicModule {
    return {
      module: RamAuthorizationModule,
      global: options.isGlobal,
      imports: options.imports || [],
      providers: [
        ...this.createAsyncProviders(options),
        {
          provide: RAM_POLICY_PROVIDERS,
          useFactory: (ramOptions: RamAuthorizationOptions) => [
            new JwtClaimsPolicyProvider(ramOptions.ramClaimTypeName),
          ],
          inject: [RAM_AUTHORIZATION_OPTIONS],
        },
        CompositePolicyProvider,
        RAMAuthorizationEvaluator,
        RamResourceFilterInterceptor,
        RamResourceQueryHelper,
      ],
      exports: [
        RAM_AUTHORIZATION_OPTIONS,
        RAM_POLICY_PROVIDERS,
        CompositePolicyProvider,
        RAMAuthorizationEvaluator,
        RamResourceFilterInterceptor,
        RamResourceQueryHelper,
      ],
    };
  }

  private static createAsyncProviders(options: RamAuthorizationAsyncOptions): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass!,
        useClass: options.useClass!,
      },
    ];
  }

  private static createAsyncOptionsProvider(options: RamAuthorizationAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: RAM_AUTHORIZATION_OPTIONS,
        useFactory: async (...args: any[]) => {
          let config = await options.useFactory!(...args);
          config = { ...DefaultRamAuthorizationOptions, ...config };
          this.assertOptions(config);

          return config;
        },
        inject: options.inject || [],
      };
    }
    return {
      provide: RAM_AUTHORIZATION_OPTIONS,
      useFactory: async (optionsFactory: RamAuthorizationOptionsFactory) => {
        let config = await optionsFactory.createRamAuthorizationOptions();
        config = { ...DefaultRamAuthorizationOptions, ...config };
        this.assertOptions(config);

        return config;
      },
      inject: [options.useExisting! || options.useClass!],
    };
  }

  private static assertOptions(options: RamAuthorizationOptions) {
    if (!options.serviceName) {
      const errorMessage = `Missing "serviceName" option.`;
      throw new Error(errorMessage);
    }
  }
}
