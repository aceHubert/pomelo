import { Module, DynamicModule, Provider, Logger } from '@nestjs/common';
import {
  SequelizeOptions,
  SequelizeAsyncOptions,
  SequelizeOptionsFactory,
} from './interfaces/sequelize-options.interface';
import * as DataSources from './datasources';
import { SequelizeService } from './sequelize.service';
import { SEQUELIZE_OPTIONS } from './constants';

const dataSourceProviders = Object.values(DataSources);

@Module({
  providers: [...dataSourceProviders, SequelizeService],
  exports: [...dataSourceProviders, SequelizeService],
})
export class SequelizeModule {
  private static readonly logger = new Logger(SequelizeModule.name, { timestamp: true });

  static register(options: SequelizeOptions): DynamicModule {
    // check connection config
    this.assertConnection(options.connection);

    const { isGlobal, ...restOptions } = options;
    return {
      module: SequelizeModule,
      global: isGlobal,
      providers: [
        {
          provide: SEQUELIZE_OPTIONS,
          useValue: restOptions,
        },
      ],
    };
  }

  static registerAsync(options: SequelizeAsyncOptions): DynamicModule {
    return {
      module: SequelizeModule,
      global: options.isGlobal,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options),
    };
  }

  private static createAsyncProviders(options: SequelizeAsyncOptions): Provider[] {
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

  private static createAsyncOptionsProvider(options: SequelizeAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: SEQUELIZE_OPTIONS,
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
      provide: SEQUELIZE_OPTIONS,
      useFactory: async (optionsFactory: SequelizeOptionsFactory) => {
        const moduleOptions = await optionsFactory.createSequlizeOptions();
        // check connection config
        this.assertConnection(moduleOptions.connection);
        return moduleOptions;
      },
      inject: [options.useExisting! || options.useClass!],
    };
  }

  private static assertConnection(connection: SequelizeOptions['connection']) {
    if (typeof connection !== 'string' && (!connection.database || !connection.username)) {
      const errorMessage = `Missing reqiured option "${
        !connection.database ? 'database' : !connection.username ? 'username' : ''
      }" in "database.connection".`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }
}
