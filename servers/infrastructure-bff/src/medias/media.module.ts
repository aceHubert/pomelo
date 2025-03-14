import { Module, Provider, DynamicModule } from '@nestjs/common';
import { MediaOptions, FileAsyncOptions, MediaOptionsFactory } from './interfaces/media-options.interface';
import { MediaController } from './media.controller';
import { MediaResolver } from './media.resolver';
import { MediaService } from './media.service';
import { MEDIA_OPTIONS } from './constants';

const DefaultOptions: MediaOptions = {
  dest: process.cwd(),
  groupBy: 'month',
  staticPrefix: 'uploads',
};

@Module({})
export class MediaModule {
  static forRoot(options: MediaOptions): DynamicModule {
    return {
      module: MediaModule,
      global: options.isGlobal,
      controllers: [MediaController],
      providers: [
        {
          provide: MEDIA_OPTIONS,
          useValue: { ...DefaultOptions, options },
        },
        MediaResolver,
        MediaService,
      ],
      exports: [MediaService],
    };
  }

  static forRootAsync(options: FileAsyncOptions): DynamicModule {
    return {
      module: MediaModule,
      global: options.isGlobal,
      controllers: [MediaController],
      imports: options.imports || [],
      providers: [...this.createAsyncProviders(options), MediaResolver, MediaService],
      exports: [MediaService],
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
        provide: MEDIA_OPTIONS,
        useFactory: async (...args: any[]) => {
          const config = await options.useFactory!(...args);
          return { ...DefaultOptions, ...config };
        },
        inject: options.inject || [],
      };
    }
    return {
      provide: MEDIA_OPTIONS,
      useFactory: async (optionsFactory: MediaOptionsFactory) => {
        const config = await optionsFactory.createFileOptions();
        return { ...DefaultOptions, ...config };
      },
      inject: [options.useExisting! || options.useClass!],
    };
  }
}
