import * as fs from 'fs';
import * as path from 'path';
import { Module, DynamicModule, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { INFRASTRUCTURE_SERVICE } from '@ace-pomelo/shared/server';
import { ErrorHandlerClientTCP, I18nSerializer } from '../common/utils/i18n-client-tcp.util';
import { UserDatasourceModule } from '../user-datasource';
import { AccountDBReadService } from './account-db-read.service';
import { AccountGrcpService } from './account-grcp.service';
import { AccountProviderService } from './account-provider.service';
import {
  AccountProviderOptions,
  AccountProviderAsyncOptions,
  AccountProviderOptionsFactory,
} from './interfaces/account-provider-options.interface';
import { ACCOUNT_PROVIDER_OPTIONS } from './constants';

type AccountProviderMode = 'direct-db' | 'microservice';

function readAccountProviderFromEnvFiles() {
  const envFiles = process.env.ENV_FILE
    ? [process.env.ENV_FILE]
    : (process.env.NODE_ENV === 'production'
        ? ['.env.production', '.env']
        : ['.env.development.local', '.env.development']
      ).flatMap((file) => {
        if (path.isAbsolute(file)) {
          return [file];
        }

        return [
          path.resolve(process.cwd(), file),
          path.join(__dirname, file),
          path.join(__dirname, '../', file),
          path.join(__dirname, '../../', file),
        ];
      });

  for (const file of Array.from(new Set(envFiles))) {
    if (!fs.existsSync(file)) {
      continue;
    }

    const match = fs
      .readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.match(/^\s*ACCOUNT_PROVIDER\s*(?:=|:)\s*(.*)\s*$/))
      .find(Boolean);
    const value = match?.[1]?.replace(/^['"]|['"]$/g, '').trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

function getAccountProviderMode(): AccountProviderMode {
  const mode = (process.env.ACCOUNT_PROVIDER || readAccountProviderFromEnvFiles() || 'direct-db').toLowerCase();
  if (mode === 'direct-db' || mode === 'microservice') {
    return mode;
  }
  throw new Error(`Unsupported ACCOUNT_PROVIDER "${mode}". Allowed values: direct-db, microservice.`);
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
    const mode = getAccountProviderMode();
    if (mode === 'direct-db') {
      return this.forDirectDb(options);
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

  private static forDirectDb(options: AccountProviderAsyncOptions): DynamicModule {
    return {
      module: AccountProviderModule,
      global: options.isGlobal,
      imports: [
        ...(options.imports || []),
        UserDatasourceModule.registerAsync({
          useFactory: (config: ConfigService) => ({
            connection: config.get('IDENTITY_DATABASE_CONNECTION')
              ? config.get<string>('IDENTITY_DATABASE_CONNECTION')!
              : {
                  database: config.getOrThrow('IDENTITY_DATABASE_NAME'),
                  username: config.getOrThrow('IDENTITY_DATABASE_USERNAME'),
                  password: config.getOrThrow('IDENTITY_DATABASE_PASSWORD'),
                  dialect: config.get('IDENTITY_DATABASE_DIALECT', 'mysql'),
                  host: config.get('IDENTITY_DATABASE_HOST', 'localhost'),
                  port: config.get('IDENTITY_DATABASE_PORT', 3306),
                  define: {
                    charset: config.get('IDENTITY_DATABASE_CHARSET', 'utf8'),
                    collate: config.get('IDENTITY_DATABASE_COLLATE', ''),
                  },
                },
            tablePrefix: config.get('TABLE_PREFIX'),
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
              name: INFRASTRUCTURE_SERVICE,
              useFactory: (config: ConfigService) => ({
                customClass: ErrorHandlerClientTCP,
                options: {
                  host: config.get('INFRASTRUCTURE_SERVICE_HOST', ''),
                  port: config.getOrThrow('INFRASTRUCTURE_SERVICE_PORT'),
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
