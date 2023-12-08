import { Module, DynamicModule, Provider, Logger } from '@nestjs/common';
import { IdentityOptions, IdentityAsyncOptions, IdentityOptionsFactory } from './interfaces/identity-options.interface';
import * as DataSources from './sequelize/datasources';
import { IdentityService } from './identity.service';
import { IDENTITY_OPTIONS } from './constants';

const dataSourceProviders = Object.values(DataSources);

@Module({
  providers: [...dataSourceProviders, IdentityService],
  exports: [...dataSourceProviders, IdentityService],
})
export class IdentityModule {
  private static readonly logger = new Logger(IdentityModule.name, { timestamp: true });

  static register(options: IdentityOptions): DynamicModule {
    // check connection config
    this.assertConnection(options.connection);

    const { isGlobal, ...restOptions } = options;
    return {
      module: IdentityModule,
      global: isGlobal,
      providers: [
        {
          provide: IDENTITY_OPTIONS,
          useValue: restOptions,
        },
      ],
    };
  }

  static registerAsync(options: IdentityAsyncOptions): DynamicModule {
    return {
      module: IdentityModule,
      global: options.isGlobal,
      imports: options.imports || [],
      providers: [...this.createAsyncProviders(options)],
    };
  }

  private static createAsyncProviders(options: IdentityAsyncOptions): Provider[] {
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

  private static createAsyncOptionsProvider(options: IdentityAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: IDENTITY_OPTIONS,
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
      provide: IDENTITY_OPTIONS,
      useFactory: async (optionsFactory: IdentityOptionsFactory) => {
        const moduleOptions = await optionsFactory.createSequlizeOptions();
        // check connection config
        this.assertConnection(moduleOptions.connection);
        return moduleOptions;
      },
      inject: [options.useExisting! || options.useClass!],
    };
  }

  private static assertConnection(connection: IdentityOptions['connection']) {
    if (typeof connection !== 'string' && (!connection.database || !connection.username)) {
      const errorMessage = `Missing reqiured option "${
        !connection.database ? 'database' : !connection.username ? 'username' : ''
      }" in "database.connection".`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }
}
