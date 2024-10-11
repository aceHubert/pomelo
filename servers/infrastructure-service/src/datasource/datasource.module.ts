import { Module, DynamicModule, Provider, Logger } from '@nestjs/common';
import {
  InfrastructureDatasourceOptions,
  InfrastructureDatasourceAsyncOptions,
  InfrastructureDatasourceOptionsFactory,
} from './interfaces/infrastructure-datasource-options.interface';
import * as DataSources from './sequelize/datasources';
import { InfrastructureDatasourceService } from './datasource.service';
import { INFRASTRUCTURE_DATASOURCE_OPTIONS } from './constants';

const dataSources = Object.values(DataSources);

@Module({})
export class InfrastructureDatasourceModule {
  private static logger = new Logger(InfrastructureDatasourceModule.name, { timestamp: true });

  static register(options: InfrastructureDatasourceOptions): DynamicModule {
    // check connection config
    this.assertConnection(options.connection);

    const { isGlobal, ...restOptions } = options;
    return {
      module: InfrastructureDatasourceModule,
      global: isGlobal,
      providers: [
        {
          provide: INFRASTRUCTURE_DATASOURCE_OPTIONS,
          useValue: restOptions,
        },
        ...dataSources,
        InfrastructureDatasourceService,
      ],
      exports: [INFRASTRUCTURE_DATASOURCE_OPTIONS, ...dataSources, InfrastructureDatasourceService],
    };
  }

  static registerAsync(options: InfrastructureDatasourceAsyncOptions): DynamicModule {
    return {
      module: InfrastructureDatasourceModule,
      global: options.isGlobal,
      imports: options.imports,
      providers: [...this.createAsyncProviders(options), ...dataSources, InfrastructureDatasourceService],
      exports: [INFRASTRUCTURE_DATASOURCE_OPTIONS, ...dataSources, InfrastructureDatasourceService],
    };
  }

  private static createAsyncProviders(options: InfrastructureDatasourceAsyncOptions): Provider[] {
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

  private static createAsyncOptionsProvider(options: InfrastructureDatasourceAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: INFRASTRUCTURE_DATASOURCE_OPTIONS,
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
      provide: INFRASTRUCTURE_DATASOURCE_OPTIONS,
      useFactory: async (optionsFactory: InfrastructureDatasourceOptionsFactory) => {
        const moduleOptions = await optionsFactory.createSequlizeOptions();
        // check connection config
        this.assertConnection(moduleOptions.connection);
        return moduleOptions;
      },
      inject: [options.useExisting! || options.useClass!],
    };
  }

  private static assertConnection(connection: InfrastructureDatasourceOptions['connection']) {
    if (typeof connection !== 'string' && (!connection.database || !connection.username)) {
      const errorMessage = `Missing reqiured option "${
        !connection.database ? 'database' : !connection.username ? 'username' : ''
      }" in "database.connection".`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }
}
