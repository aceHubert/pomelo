import { Module, DynamicModule, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { CountryCode } from 'libphonenumber-js';
import { ErrorHandlerClientTCP, I18nSerializer } from '../common/utils/i18n-client-tcp.util';
import { UserDatasourceModule } from '../user-datasource';
import { AccountDBReadService } from './account-db-read.service';
import { AccountGrcpService } from './account-grcp.service';
import { AccountProviderService } from './account-provider.service';
import {
  AccountProviderOptions,
  AccountProviderAsyncOptions,
  AccountProviderOptionsFactory,
  AccountProviderUse,
} from './interfaces/account-provider-options.interface';
import { ACCOUNT_PROVIDER_OPTIONS, USER_MICROSERVICE_SERVICE } from './constants';

function normalizeProviderUse(providerUse: AccountProviderUse): AccountProviderUse {
  const mode = providerUse.toLowerCase();
  if (mode === 'database' || mode === 'microservice') {
    return mode;
  }
  throw new Error(`Unsupported providerUse "${mode}". Allowed values: database, microservice.`);
}

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
    const providerUse = normalizeProviderUse(options.providerUse);
    if (providerUse === 'database') {
      return this.forDatabase(options);
    }
    if (!options.useClass && !options.useExisting && !options.useFactory) {
      return this.forMicroservice(options);
    }

    return {
      module: AccountProviderModule,
      global: options.isGlobal,
      imports: options.imports || [],
      providers: [...this.createAsyncProviders(options), AccountProviderService],
      exports: [ACCOUNT_PROVIDER_OPTIONS, AccountProviderService],
    };
  }

  private static forDatabase(options: AccountProviderAsyncOptions): DynamicModule {
    return {
      module: AccountProviderModule,
      global: options.isGlobal,
      imports: [
        ...(options.imports || []),
        UserDatasourceModule.registerAsync({
          useFactory: (config: ConfigService) => ({
            connection: config.get('USER_DATABASE_CONNECTION')
              ? config.get<string>('USER_DATABASE_CONNECTION')!
              : {
                  database: config.getOrThrow('USER_DATABASE_NAME'),
                  username: config.getOrThrow('USER_DATABASE_USERNAME'),
                  password: config.getOrThrow('USER_DATABASE_PASSWORD'),
                  dialect: config.get('USER_DATABASE_DIALECT', 'mysql'),
                  host: config.get('USER_DATABASE_HOST', 'localhost'),
                  port: config.get('USER_DATABASE_PORT', 3306),
                  define: {
                    charset: config.get('USER_DATABASE_CHARSET', 'utf8'),
                    collate: config.get('USER_DATABASE_COLLATE', ''),
                  },
                },
            tablePrefix: config.get('USER_DATABASE_TABLE_PREFIX'),
            phoneRegionCode: config.get<CountryCode>('USER_PHONE_REGION_CODE'),
          }),
          inject: [ConfigService],
        }),
      ],
      providers: [
        AccountDBReadService,
        {
          provide: ACCOUNT_PROVIDER_OPTIONS,
          useFactory: async (optionsFactory: AccountDBReadService) => optionsFactory.createAccountProviderOptions(),
          inject: [AccountDBReadService],
        },
        AccountProviderService,
      ],
      exports: [ACCOUNT_PROVIDER_OPTIONS, AccountProviderService],
    };
  }

  private static forMicroservice(options: AccountProviderAsyncOptions): DynamicModule {
    return {
      module: AccountProviderModule,
      global: options.isGlobal,
      imports: [
        ...(options.imports || []),
        ClientsModule.registerAsync({
          clients: [
            {
              name: USER_MICROSERVICE_SERVICE,
              useFactory: (config: ConfigService) => ({
                customClass: ErrorHandlerClientTCP,
                options: {
                  host: config.get('USER_MICROSERVICE_HOST', ''),
                  port: config.getOrThrow('USER_MICROSERVICE_PORT'),
                  serializer: new I18nSerializer(),
                },
              }),
              inject: [ConfigService],
            },
          ],
        }),
      ],
      providers: [
        AccountGrcpService,
        {
          provide: ACCOUNT_PROVIDER_OPTIONS,
          useFactory: async (optionsFactory: AccountGrcpService) => optionsFactory.createAccountProviderOptions(),
          inject: [AccountGrcpService],
        },
        AccountProviderService,
      ],
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
