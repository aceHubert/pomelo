import { Module, DynamicModule, Provider, Logger } from '@nestjs/common';
import {
  InfrastructureOptions,
  InfrastructureAsyncOptions,
  InfrastructureOptionsFactory,
} from './interfaces/infrastructure-options.interface';
import { dataSources } from './sequelize';
import { InfrastructureService } from './infrastructure.service';
import { INFRASTRUCTURE_OPTIONS } from './constants';

@Module({})
export class InfrastructureModule {
  private static readonly logger = new Logger(InfrastructureModule.name, { timestamp: true });

  static register(options: InfrastructureOptions): DynamicModule {
    // check connection config
    this.assertConnection(options.connection);

    const { isGlobal, ...restOptions } = options;
    return {
      module: InfrastructureModule,
      global: isGlobal,
      providers: [
        {
          provide: INFRASTRUCTURE_OPTIONS,
          useValue: restOptions,
        },
        ...dataSources,
        InfrastructureService,
      ],
      exports: [INFRASTRUCTURE_OPTIONS, ...dataSources, InfrastructureService],
    };
  }

  static registerAsync(options: InfrastructureAsyncOptions): DynamicModule {
    return {
      module: InfrastructureModule,
      global: options.isGlobal,
      imports: options.imports,
      providers: [...this.createAsyncProviders(options), ...dataSources, InfrastructureService],
      exports: [INFRASTRUCTURE_OPTIONS, ...dataSources, InfrastructureService],
    };
  }

  private static createAsyncProviders(options: InfrastructureAsyncOptions): Provider[] {
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

  private static createAsyncOptionsProvider(options: InfrastructureAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: INFRASTRUCTURE_OPTIONS,
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
      provide: INFRASTRUCTURE_OPTIONS,
      useFactory: async (optionsFactory: InfrastructureOptionsFactory) => {
        const moduleOptions = await optionsFactory.createSequlizeOptions();
        // check connection config
        this.assertConnection(moduleOptions.connection);
        return moduleOptions;
      },
      inject: [options.useExisting! || options.useClass!],
    };
  }

  private static assertConnection(connection: InfrastructureOptions['connection']) {
    if (typeof connection !== 'string' && (!connection.database || !connection.username)) {
      const errorMessage = `Missing reqiured option "${
        !connection.database ? 'database' : !connection.username ? 'username' : ''
      }" in "database.connection".`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }
}
