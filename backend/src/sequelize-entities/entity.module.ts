import { Module, DynamicModule, Provider, Logger, OnApplicationShutdown } from '@nestjs/common';
import { EntityService } from './entity.service';
import { SEQUELIZE_ENTITY_OPTIONS } from './constants';

// Types
import {
  EntityModuleOptions,
  EntityModuleAsyncOptions,
  EntityOptionsFactory,
} from './interfaces/entity-module-options.interface';

@Module({
  providers: [EntityService],
  exports: [EntityService],
})
export class EntityModule implements OnApplicationShutdown {
  private static readonly logger = new Logger(EntityModule.name, { timestamp: true });

  constructor(private readonly entityService: EntityService) {}

  static register(config: EntityModuleOptions): DynamicModule {
    // check connection config
    this.assertConnection(config.connection);
    return {
      module: EntityModule,
      providers: [
        {
          provide: SEQUELIZE_ENTITY_OPTIONS,
          useValue: config,
        },
      ],
    };
  }

  static registerAsync(options: EntityModuleAsyncOptions): DynamicModule {
    return {
      module: EntityModule,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options),
    };
  }

  private static createAsyncProviders(options: EntityModuleAsyncOptions): Provider[] {
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

  private static createAsyncOptionsProvider(options: EntityModuleAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: SEQUELIZE_ENTITY_OPTIONS,
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
      provide: SEQUELIZE_ENTITY_OPTIONS,
      useFactory: async (optionsFactory: EntityOptionsFactory) => {
        const moduleOptions = await optionsFactory.createEntityOptions();
        // check connection config
        this.assertConnection(moduleOptions.connection);
        return moduleOptions;
      },
      inject: [options.useExisting! || options.useClass!],
    };
  }

  private static assertConnection(connection: EntityModuleOptions['connection']) {
    if (typeof connection !== 'string' && (!connection.database || !connection.username)) {
      const errorMessage = `Missing reqiured option "${
        !connection.database ? 'database' : !connection.username ? 'username' : ''
      }" in "database.connection".`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  onApplicationShutdown() {
    // close db connection
    this.entityService.sequelize && this.entityService.sequelize.close();
  }
}
