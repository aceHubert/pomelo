import { Module, Provider, DynamicModule, Logger } from '@nestjs/common';
import { ObsFileController } from './obs.controller';
import { ObsFileResolver } from './obs.resolver';
import { HWCloudObsService } from './obs.service';
import {
  FileOptions,
  FileAsyncOptions,
  FileOptionsFactory,
  ObsFileOptions,
  LocalFileOptions,
} from './interfaces/file-options.interface';
import { FILE_OPTIONS, FILE_USE, Use } from './constants';

export const UploadUse = Use;

function isValidUse(use: string): use is Use {
  const options: string[] = Object.values(Use);
  return options.includes(use);
}

@Module({
  providers: [HWCloudObsService],
  exports: [HWCloudObsService],
})
export class FileModule {
  private static logger = new Logger(FileModule.name, { timestamp: true });

  static forRoot<UseOptions extends LocalFileOptions | ObsFileOptions = LocalFileOptions & ObsFileOptions>(
    options: FileOptions<UseOptions>,
  ): DynamicModule {
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
    const exports = [];
    if (use.includes(Use.Local)) {
      // TODO: 本地上传方法
    }
    if (use.includes(Use.Obs)) {
      this.assertObsClient(options as any as ObsFileOptions);
      controllers.push(ObsFileController);
      providers.push(HWCloudObsService, ObsFileResolver);
      exports.push(HWCloudObsService);
    }

    return {
      module: FileModule,
      global: options.isGlobal,
      controllers,
      providers: [
        ...providers,
        {
          provide: FILE_OPTIONS,
          useValue: options,
        },
        {
          provide: FILE_USE,
          useValue: use,
        },
      ],
      exports,
    };
  }

  static forRootAsync<UseOptions extends LocalFileOptions | ObsFileOptions = LocalFileOptions & ObsFileOptions>(
    options: FileAsyncOptions<UseOptions>,
  ): DynamicModule {
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
    const exports = [];
    if (use.includes(Use.Local)) {
      // TODO: 本地上传方法
    }
    if (use.includes(Use.Obs)) {
      controllers.push(ObsFileController);
      providers.push(HWCloudObsService, ObsFileResolver);
      exports.push(HWCloudObsService);
    }

    return {
      module: FileModule,
      global: options.isGlobal,
      imports: options.imports || [],
      controllers,
      providers: [
        ...providers,
        ...this.createAsyncProviders(use, options),
        {
          provide: FILE_USE,
          useValue: use,
        },
      ],
      exports,
    };
  }

  private static createAsyncProviders(
    use: Use[],
    options: FileAsyncOptions<LocalFileOptions | ObsFileOptions>,
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
    options: FileAsyncOptions<LocalFileOptions | ObsFileOptions>,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: FILE_OPTIONS,
        useFactory: async (...args: any[]) => {
          const config = await options.useFactory!(...args);
          if (use.includes(Use.Local)) {
            // TODO: 本地上传方法
          }
          if (use.includes(Use.Obs)) {
            this.assertObsClient(config as ObsFileOptions);
          }
          return config;
        },
        inject: options.inject || [],
      };
    }
    return {
      provide: FILE_OPTIONS,
      useFactory: async (optionsFactory: FileOptionsFactory<LocalFileOptions | ObsFileOptions>) => {
        const config = await optionsFactory.createFileOptions();
        if (use.includes(Use.Local)) {
          // TODO: 本地上传方法
        }
        if (use.includes(Use.Obs)) {
          this.assertObsClient(config as ObsFileOptions);
        }
        return config;
      },
      inject: [options.useExisting! || options.useClass!],
    };
  }

  private static assertObsClient(options: ObsFileOptions) {
    if (!options.accessKey || !options.secretKey || !options.endpoint) {
      const message = `"${[
        !options.accessKey && 'access_key_id',
        !options.secretKey && 'secret_access_key',
        !options.endpoint && 'server',
      ]
        .filter(Boolean)
        .join(', ')}" in ObsClient options is required,
        please check on https://support.huaweicloud.com/intl/zh-cn/api-obs_nodejs_sdk_api_zh/obs_39_0101.html!`;
      this.logger.error(message);

      throw new Error(message);
    }
  }
}
