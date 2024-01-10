import { Module, DynamicModule, Provider } from '@nestjs/common';
import { RedisService } from './redis.service';
import { StorageOptions, StorageAsyncOptions, StorageOptionsFactory } from './interfaces/storage-options.interface';
import { STORAGE_OPTIONS } from './constants';

@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class StorageModule {
  static forRoot(options: StorageOptions): DynamicModule {
    const { isGlobal, ...restOptions } = options;
    return {
      module: StorageModule,
      global: isGlobal,
      providers: [
        {
          provide: STORAGE_OPTIONS,
          useValue: restOptions,
        },
      ],
    };
  }

  static forRootAsync(options: StorageAsyncOptions): DynamicModule {
    return {
      module: StorageModule,
      global: options.isGlobal,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options),
    };
  }

  private static createAsyncProviders(options: StorageAsyncOptions): Provider[] {
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

  private static createAsyncOptionsProvider(options: StorageAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: STORAGE_OPTIONS,
        useFactory: async (...args: any[]) => {
          const config = await options.useFactory!(...args);
          return config;
        },
        inject: options.inject || [],
      };
    }
    return {
      provide: STORAGE_OPTIONS,
      useFactory: async (optionsFactory: StorageOptionsFactory) => {
        const config = await optionsFactory.createStorageOptions();
        return config;
      },
      inject: [options.useExisting! || options.useClass!],
    };
  }
}
