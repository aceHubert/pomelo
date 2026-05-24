import { DynamicModule, Logger, Module, Provider } from '@nestjs/common';
import {
  UserDatasourceAsyncOptions,
  UserDatasourceOptions,
  UserDatasourceOptionsFactory,
} from './interfaces/user-datasource-options.interface';
import { USER_DATASOURCE_OPTIONS } from './constants';
import { UserDatasourceService } from './user-datasource.service';

@Module({})
export class UserDatasourceModule {
  private static logger = new Logger(UserDatasourceModule.name, { timestamp: true });

  static register(options: UserDatasourceOptions): DynamicModule {
    this.assertConnection(options.connection);

    const { isGlobal, ...restOptions } = options;
    return {
      module: UserDatasourceModule,
      global: isGlobal,
      providers: [
        {
          provide: USER_DATASOURCE_OPTIONS,
          useValue: restOptions,
        },
        UserDatasourceService,
      ],
      exports: [USER_DATASOURCE_OPTIONS, UserDatasourceService],
    };
  }

  static registerAsync(options: UserDatasourceAsyncOptions): DynamicModule {
    return {
      module: UserDatasourceModule,
      global: options.isGlobal,
      imports: options.imports,
      providers: [...this.createAsyncProviders(options), UserDatasourceService],
      exports: [USER_DATASOURCE_OPTIONS, UserDatasourceService],
    };
  }

  private static createAsyncProviders(options: UserDatasourceAsyncOptions): Provider[] {
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

  private static createAsyncOptionsProvider(options: UserDatasourceAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: USER_DATASOURCE_OPTIONS,
        useFactory: async (...args: any[]) => {
          const moduleOptions = await options.useFactory!(...args);
          this.assertConnection(moduleOptions.connection);
          return moduleOptions;
        },
        inject: options.inject || [],
      };
    }
    return {
      provide: USER_DATASOURCE_OPTIONS,
      useFactory: async (optionsFactory: UserDatasourceOptionsFactory) => {
        const moduleOptions = await optionsFactory.createUserDatasourceOptions();
        this.assertConnection(moduleOptions.connection);
        return moduleOptions;
      },
      inject: [options.useExisting! || options.useClass!],
    };
  }

  private static assertConnection(connection: UserDatasourceOptions['connection']) {
    if (typeof connection !== 'string' && (!connection.database || !connection.username)) {
      const errorMessage = `Missing reqiured option "${
        !connection.database ? 'database' : !connection.username ? 'username' : ''
      }" in "database.connection".`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }
}
