import { Module, DynamicModule, Provider, Logger } from '@nestjs/common';
import { UnpkgSubModuleController } from './unpkg.controller';
import { ObsSubModuleController } from './obs.controller';
import { UnpkgSubModuleResolver } from './unpkg.resolver';
import { ObsSubModuleResolver } from './obs.resolver';
import { UnpkgSubModuleService } from './unpkg.service';
import { ObsSubModuleService } from './obs.service';
import { Use, SUBMODULE_OPTIONS, SUBMODULE_USE } from './constants';

// Types
import {
  SubModuleOptions,
  UnpkgSubModuleOptions,
  ObsSubModuleOptions,
  SubModuleOptionsFactory,
  SubModuleAsyncOptions,
} from './interfaces/submodule-options.interface';

export const SubModuleUse = Use;

function isValidUse(use: string): use is Use {
  const options: string[] = Object.values(Use);
  return options.includes(use);
}

@Module({})
export class SubModuleModule {
  private static logger = new Logger(SubModuleModule.name, { timestamp: true });

  static forRoot<
    UseOpitons extends UnpkgSubModuleOptions | ObsSubModuleOptions = UnpkgSubModuleOptions & ObsSubModuleOptions,
  >(options: SubModuleOptions<UseOpitons>): DynamicModule {
    let use: Use[] = Object.values(Use);
    if (options.use) {
      if (typeof options.use === 'string' && isValidUse(options.use)) {
        use = [options.use];
      } else if (options.use.length) {
        use = options.use;
      }
    }

    const controllers = [];
    const providers = [];
    if (use.includes(Use.Unpkg)) {
      this.assertKeywords(options as any as UnpkgSubModuleOptions);
      controllers.push(UnpkgSubModuleController);
      providers.push(UnpkgSubModuleService, UnpkgSubModuleResolver);
    }
    if (use.includes(Use.Obs)) {
      this.assertBucket(options as any as ObsSubModuleOptions);
      controllers.push(ObsSubModuleController);
      providers.push(ObsSubModuleService, ObsSubModuleResolver);
    }

    return {
      module: SubModuleModule,
      controllers,
      providers: [
        ...providers,
        {
          provide: SUBMODULE_OPTIONS,
          useValue: options,
        },
        {
          provide: SUBMODULE_USE,
          useValue: use,
        },
      ],
    };
  }

  static forRootAsync<
    UseOpitons extends UnpkgSubModuleOptions | ObsSubModuleOptions = UnpkgSubModuleOptions & ObsSubModuleOptions,
  >(options: SubModuleAsyncOptions<UseOpitons>): DynamicModule {
    let use: Use[] = Object.values(Use);
    if (options.use) {
      if (typeof options.use === 'string' && isValidUse(options.use)) {
        use = [options.use];
      } else if (options.use.length) {
        use = options.use;
      }
    }

    const controllers = [];
    const providers = [];
    if (use.includes(Use.Unpkg)) {
      controllers.push(UnpkgSubModuleController);
      providers.push(UnpkgSubModuleService, UnpkgSubModuleResolver);
    }
    if (use.includes(Use.Obs)) {
      controllers.push(ObsSubModuleController);
      providers.push(ObsSubModuleService, ObsSubModuleResolver);
    }

    return {
      module: SubModuleModule,
      imports: options!.imports || [],
      controllers: controllers,
      providers: [
        ...providers,
        ...this.createAsyncProviders(use, options!),
        {
          provide: SUBMODULE_USE,
          useValue: use,
        },
      ],
    };
  }

  private static createAsyncProviders(
    use: Use[],
    options: SubModuleAsyncOptions<UnpkgSubModuleOptions | ObsSubModuleOptions>,
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(use, options)];
    }
    return [
      this.createAsyncOptionsProvider(use, options),
      {
        provide: options.useClass!,
        useClass: options.useClass!,
      },
    ];
  }

  private static createAsyncOptionsProvider(
    use: Use[],
    options: SubModuleAsyncOptions<UnpkgSubModuleOptions | ObsSubModuleOptions>,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: SUBMODULE_OPTIONS,
        useFactory: async (...args: any[]) => {
          const config = await options.useFactory!(...args);
          if (use.includes(Use.Unpkg)) {
            this.assertKeywords(config as UnpkgSubModuleOptions);
          }
          if (use.includes(Use.Obs)) {
            this.assertBucket(config as ObsSubModuleOptions);
          }

          return config;
        },
        inject: options.inject || [],
      };
    }
    return {
      provide: SUBMODULE_OPTIONS,
      useFactory: async (optionsFactory: SubModuleOptionsFactory<UnpkgSubModuleOptions | ObsSubModuleOptions>) => {
        const config = await optionsFactory.createSubModuleOptions();
        if (use.includes(Use.Unpkg)) {
          this.assertKeywords(config as UnpkgSubModuleOptions);
        }
        if (use.includes(Use.Unpkg)) {
          this.assertBucket(config as ObsSubModuleOptions);
        }

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

  private static assertBucket(options: ObsSubModuleOptions) {
    if (!options.bucket) {
      const message = `"bucket" in SubModule options is required,
        please check on https://support.huaweicloud.com/intl/zh-cn/api-obs_nodejs_sdk_api_zh/obs_39_0305.html in "request params" section!`;
      this.logger.error(message);

      throw new Error(message);
    }
  }
}
