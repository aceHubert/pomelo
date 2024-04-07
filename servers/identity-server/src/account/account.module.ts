import { Module, DynamicModule, Provider } from '@nestjs/common';
import { AccountOptions, AccountAsyncOptions, AccountOptionsFactory } from './interfaces/account-options.interface';
import { DiscoveryController } from './discovery.controller';
import { SecurityController } from './security.controller';
import { LoginController } from './login.controller';
import { PasswordController } from './password.controller';
import { ACCOUNT_OPTIONS } from './constants';

@Module({})
export class AccountModule {
  static forRoot(options: AccountOptions): DynamicModule {
    return {
      module: AccountModule,
      controllers: [DiscoveryController, SecurityController, LoginController, PasswordController],
      providers: [
        {
          provide: ACCOUNT_OPTIONS,
          useValue: options,
        },
      ],
    };
  }

  static forRootAsync(options: AccountAsyncOptions): DynamicModule {
    return {
      module: AccountModule,
      controllers: [DiscoveryController, SecurityController, LoginController, PasswordController],
      imports: options.imports || [],
      providers: this.createAsyncProviders(options),
    };
  }

  private static createAsyncProviders(options: AccountAsyncOptions): Provider[] {
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

  private static createAsyncOptionsProvider(options: AccountAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: ACCOUNT_OPTIONS,
        useFactory: async (...args: any[]) => {
          const config = await options.useFactory!(...args);
          return config;
        },
        inject: options.inject || [],
      };
    }
    return {
      provide: ACCOUNT_OPTIONS,
      useFactory: async (optionsFactory: AccountOptionsFactory) => {
        const config = await optionsFactory.createAccountOptions();
        return config;
      },
      inject: [options.useExisting! || options.useClass!],
    };
  }
}
