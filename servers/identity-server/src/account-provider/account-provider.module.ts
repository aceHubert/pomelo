import { Module, DynamicModule, Provider } from '@nestjs/common';
import { AccountProviderService } from './account-provider.service';
import {
  AccountProviderOptions,
  AccountProviderAsyncOptions,
  AccountProviderOptionsFactory,
} from './interfaces/account-provider-options.interface';
import { ACCOUNT_PROVIDER_OPTIONS } from './constants';

@Module({})
export class AccountProviderModule {
  static forRoot(options: AccountProviderOptions): DynamicModule {
    const { isGlobal, ...restOptions } = options;
    return {
      module: AccountProviderModule,
      global: isGlobal,
      providers: [
        {
          provide: ACCOUNT_PROVIDER_OPTIONS,
          useValue: restOptions,
        },
        AccountProviderService,
      ],
      exports: [ACCOUNT_PROVIDER_OPTIONS, AccountProviderService],
    };
  }

  static forRootAsync(options: AccountProviderAsyncOptions): DynamicModule {
    return {
      module: AccountProviderModule,
      global: options.isGlobal,
      imports: options.imports || [],
      providers: [...this.createAsyncProviders(options), AccountProviderService],
      exports: [ACCOUNT_PROVIDER_OPTIONS, AccountProviderService],
    };
  }

  private static createAsyncProviders(options: AccountProviderAsyncOptions): Provider[] {
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

  private static createAsyncOptionsProvider(options: AccountProviderAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: ACCOUNT_PROVIDER_OPTIONS,
        useFactory: async (...args: any[]) => {
          const config = await options.useFactory!(...args);
          return config;
        },
        inject: options.inject || [],
      };
    }
    return {
      provide: ACCOUNT_PROVIDER_OPTIONS,
      useFactory: async (optionsFactory: AccountProviderOptionsFactory) => {
        const config = await optionsFactory.createAccountProviderOptions();
        return config;
      },
      inject: [options.useExisting! || options.useClass!],
    };
  }
}
