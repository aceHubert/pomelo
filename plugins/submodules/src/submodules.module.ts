import { Module, Logger, DynamicModule, Provider } from '@nestjs/common';
import { UnpkgSubModuleController } from './unpkg.controller';
import { UnpkgSubModuleResolver } from './unpkg.resolver';
import { UnpkgSubModuleService } from './unpkg.service';
import {
  UnpkgSubModuleOptions,
  SubModuleOptionsFactory,
  SubModuleAsyncOptions,
} from './interfaces/submodule-options.interface';
import { SUBMODULE_OPTIONS } from './constants';

@Module({})
export class SubModuleModule {
  private static logger = new Logger(SubModuleModule.name, { timestamp: true });

  static forRoot(options: UnpkgSubModuleOptions): DynamicModule {
    const { isGlobal, ...restOptions } = options;
    return {
      module: SubModuleModule,
      global: isGlobal,
      controllers: [UnpkgSubModuleController],
      providers: [
        {
          provide: SUBMODULE_OPTIONS,
          useValue: restOptions,
        },
        UnpkgSubModuleResolver,
        UnpkgSubModuleService,
      ],
      exports: [SUBMODULE_OPTIONS],
    };
  }

  static forRootAsync(options: SubModuleAsyncOptions): DynamicModule {
    return {
      module: SubModuleModule,
      global: options.isGlobal,
      controllers: [UnpkgSubModuleController],
      imports: options!.imports,
      providers: [...this.createAsyncProviders(options), UnpkgSubModuleResolver, UnpkgSubModuleService],
      exports: [SUBMODULE_OPTIONS],
    };
  }

  private static createAsyncProviders(options: SubModuleAsyncOptions): Provider[] {
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

  private static createAsyncOptionsProvider(options: SubModuleAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: SUBMODULE_OPTIONS,
        useFactory: async (...args: any[]) => {
          const config = await options.useFactory!(...args);
          this.assertKeywords(config as UnpkgSubModuleOptions);

          return config;
        },
        inject: options.inject || [],
      };
    }
    return {
      provide: SUBMODULE_OPTIONS,
      useFactory: async (optionsFactory: SubModuleOptionsFactory) => {
        const config = await optionsFactory.createSubModuleOptions();
        this.assertKeywords(config as UnpkgSubModuleOptions);

        return config;
      },
      inject: [options.useExisting! || options.useClass!],
    };
  }

  private static assertKeywords(options: UnpkgSubModuleOptions) {
    if (!options.keywords.length) {
      const message = `"keywords" in SubModule options is required, it is for filter/show packages,
        please check on https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md in "special search qualifiers" section!`;
      this.logger.error(message);

      throw new Error(message);
    }
  }
}
