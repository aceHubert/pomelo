import { Module, DynamicModule, Provider, Logger } from '@nestjs/common';
import {
  IdentityDatasourceOptions,
  IdentityDatasourceAsyncOptions,
  IdentityDatasourceOptionsFactory,
} from './interfaces/identity-datasource-options.interface';
import * as DataSources from './sequelize/datasources';
import { IdentityDatasourceService } from './datasource.service';
import { IDENTITY_DATASOURCE_OPTIONS } from './constants';

const dataSources = Object.values(DataSources);

@Module({})
export class IdentityDatasourceModule {
  private static logger = new Logger(IdentityDatasourceModule.name, { timestamp: true });

  static register(options: IdentityDatasourceOptions): DynamicModule {
    // check connection config
    this.assertConnection(options.connection);

    const { isGlobal, ...restOptions } = options;
    return {
      module: IdentityDatasourceModule,
      global: isGlobal,
      providers: [
        {
          provide: IDENTITY_DATASOURCE_OPTIONS,
          useValue: restOptions,
        },
        IdentityDatasourceService,
        ...dataSources,
      ],
      exports: [IDENTITY_DATASOURCE_OPTIONS, IdentityDatasourceService, ...dataSources],
    };
  }

  static registerAsync(options: IdentityDatasourceAsyncOptions): DynamicModule {
    return {
      module: IdentityDatasourceModule,
      global: options.isGlobal,
      imports: options.imports,
      providers: [...this.createAsyncProviders(options), IdentityDatasourceService, ...dataSources],
      exports: [IDENTITY_DATASOURCE_OPTIONS, IdentityDatasourceService, ...dataSources],
    };
  }

  private static createAsyncProviders(options: IdentityDatasourceAsyncOptions): Provider[] {
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

  private static createAsyncOptionsProvider(options: IdentityDatasourceAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: IDENTITY_DATASOURCE_OPTIONS,
        useFactory: async (...args: any[]) => {
          const moduleOptions = await options.useFactory!(...args);
          // check connection config
          this.assertConnection(moduleOptions.connection);
          return moduleOptions;
        },
        inject: options.inject || [],
      };
    }
    return {
      provide: IDENTITY_DATASOURCE_OPTIONS,
      useFactory: async (optionsFactory: IdentityDatasourceOptionsFactory) => {
        const moduleOptions = await optionsFactory.createSequlizeOptions();
        // check connection config
        this.assertConnection(moduleOptions.connection);
        return moduleOptions;
      },
      inject: [options.useExisting! || options.useClass!],
    };
  }

  private static assertConnection(connection: IdentityDatasourceOptions['connection']) {
    if (typeof connection !== 'string' && (!connection.database || !connection.username)) {
      const errorMessage = `Missing reqiured option "${
        !connection.database ? 'database' : !connection.username ? 'username' : ''
      }" in "database.connection".`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }
}
