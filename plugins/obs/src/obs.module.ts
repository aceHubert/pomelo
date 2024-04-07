import { Module, Provider, DynamicModule } from '@nestjs/common';
import { ObsOptions, ObsOptionsFactory, ObsAsyncOptions } from './interfaces/obs-options.interface';
import { ObsController } from './obs.controller';
import { ObsResolver } from './obs.resolver';
import { ObsService } from './obs.service';
import { OBS_OPTIONS } from './constants';

@Module({})
export class FileModule {
  static forRoot(options: ObsOptions): DynamicModule {
    const { isGlobal, ...restOptions } = options;
    return {
      module: FileModule,
      global: isGlobal,
      controllers: [ObsController],
      providers: [
        {
          provide: OBS_OPTIONS,
          useValue: restOptions,
        },
        ObsService,
        ObsResolver,
      ],
      exports: [ObsService],
    };
  }

  static forRootAsync(options: ObsAsyncOptions): DynamicModule {
    return {
      module: FileModule,
      global: options.isGlobal,
      controllers: [ObsController],
      imports: options.imports,
      providers: [...this.createAsyncProviders(options), ObsService, ObsResolver],
      exports: [ObsService],
    };
  }

  private static createAsyncProviders(options: ObsAsyncOptions): Provider[] {
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

  private static createAsyncOptionsProvider(options: ObsAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: OBS_OPTIONS,
        useFactory: async (...args: any[]) => {
          const config = await options.useFactory!(...args);
          return config;
        },
        inject: options.inject || [],
      };
    }
    return {
      provide: OBS_OPTIONS,
      useFactory: async (optionsFactory: ObsOptionsFactory) => {
        const config = await optionsFactory.createObsOptions();
        return config;
      },
      inject: [options.useExisting! || options.useClass!],
    };
  }
}
