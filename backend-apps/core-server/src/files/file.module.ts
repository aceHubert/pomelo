import multer from 'multer';
import { Module, Provider, DynamicModule } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { FileOptions, FileAsyncOptions, FileOptionsFactory } from './interfaces/file-options.interface';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { FILE_OPTIONS } from './constants';

@Module({
  controllers: [FileController],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {
  static forRoot(options: FileOptions): DynamicModule {
    return {
      module: FileModule,
      global: options.isGlobal,
      imports: [
        MulterModule.register({
          storage: multer.diskStorage({ destination: options.dest }),
          // config.get('file_storage') === 'disk'
          //   ? multer.diskStorage({ destination: config.get('file_dest') })
          //   : multer.memoryStorage(),
          limits: options.limit,
        }),
      ],
      providers: [
        {
          provide: FILE_OPTIONS,
          useValue: options,
        },
      ],
    };
  }

  static forRootAsync(options: FileAsyncOptions): DynamicModule {
    return {
      module: FileModule,
      global: options.isGlobal,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options),
    };
  }

  private static createAsyncProviders(options: FileAsyncOptions): Provider[] {
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

  private static createAsyncOptionsProvider(options: FileAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: FILE_OPTIONS,
        useFactory: async (...args: any[]) => {
          const config = await options.useFactory!(...args);
          return config;
        },
        inject: options.inject || [],
      };
    }
    return {
      provide: FILE_OPTIONS,
      useFactory: async (optionsFactory: FileOptionsFactory) => {
        const config = await optionsFactory.createFileOptions();
        return config;
      },
      inject: [options.useExisting! || options.useClass!],
    };
  }
}
