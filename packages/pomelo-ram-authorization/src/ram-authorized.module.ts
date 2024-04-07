import { Module, DynamicModule, Provider } from '@nestjs/common';
import { RAMEvaluateMethods } from './core/RAMEvaluateMethods';
import {
  RamAuthorizationOptions,
  RamAuthorizationAsyncOptions,
  RamAuthorizationOptionsFactory,
} from './interfaces/ram-authorization-options.interface';
import { RAM_AUTHORIZATION_OPTIONS } from './constants';

const DefaultRamAuthorizationOptions: Partial<RamAuthorizationOptions> = {
  policyName: 'RAMAuthorizationPolicy',
  ramClaimTypeName: 'ram',
  evaluateMethod: RAMEvaluateMethods.Statement,
  userProperty: 'user',
};

@Module({})
export class RamAuthorizationModule {
  static forRoot(options: RamAuthorizationOptions): DynamicModule {
    options = { ...DefaultRamAuthorizationOptions, ...options };
    this.assertOptions(options);

    return {
      module: RamAuthorizationModule,
      global: true,
      providers: [
        {
          provide: RAM_AUTHORIZATION_OPTIONS,
          useValue: options,
        },
      ],
      exports: [RAM_AUTHORIZATION_OPTIONS],
    };
  }

  static forRootAsync(options: RamAuthorizationAsyncOptions): DynamicModule {
    return {
      module: RamAuthorizationModule,
      global: true,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options),
      exports: [RAM_AUTHORIZATION_OPTIONS],
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
