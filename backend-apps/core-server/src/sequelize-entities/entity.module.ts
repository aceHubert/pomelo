import { Module, Logger, DynamicModule, Provider } from '@nestjs/common';
import { EntityService } from './entity.service';
import {
  SequelizeEntityOptions,
  SequelizeEntityAsyncOptions,
  SequelizeEntityOptionsFactory,
} from './interfaces/sequelize-entity-options.interface';
import { SEQUELIZE_ENTITY_OPTIONS } from './constants';

@Module({
  providers: [EntityService],
  exports: [EntityService],
})
export class EntityModule {
  private static readonly logger = new Logger(EntityModule.name, { timestamp: true });

  static register(options: SequelizeEntityOptions): DynamicModule {
    // check connection config
    this.assertConnection(options.connection);
    return {
      module: EntityModule,
      providers: [
        {
          provide: SEQUELIZE_ENTITY_OPTIONS,
          useValue: options,
        },
      ],
    };
  }

  static registerAsync(options: SequelizeEntityAsyncOptions): DynamicModule {
    return {
      module: EntityModule,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options),
    };
  }

  private static createAsyncProviders(options: SequelizeEntityAsyncOptions): Provider[] {
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

  private static createAsyncOptionsProvider(options: SequelizeEntityAsyncOptions): Provider {
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
      useFactory: async (optionsFactory: SequelizeEntityOptionsFactory) => {
        const moduleOptions = await optionsFactory.createSequlizeEntityOptions();
        // check connection config
        this.assertConnection(moduleOptions.connection);
        return moduleOptions;
      },
      inject: [options.useExisting! || options.useClass!],
    };
  }

  private static assertConnection(connection: SequelizeEntityOptions['connection']) {
    if (typeof connection !== 'string' && (!connection.database || !connection.username)) {
      const errorMessage = `Missing reqiured option "${
        !connection.database ? 'database' : !connection.username ? 'username' : ''
      }" in "database.connection".`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }
}
