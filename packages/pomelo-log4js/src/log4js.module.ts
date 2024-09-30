import * as log4js from 'log4js';
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { Log4jsAsyncOptions, Log4jsOptions, Log4jsOptionsFactory } from './interfaces/log4js-options.interface';
import { parseNestModuleCallStack } from './utils/parser';
import { Log4jsService } from './log4js.service';
import { LOG4JS_DEFAULT_CONFIG } from './log4js.options';
import { LOG4JS_OPTIONS } from './constants';

@Module({})
export class Log4jsModule {
  static forRoot({ isGlobal, ...options }: Partial<Log4jsOptions> = {}): DynamicModule {
    return {
      module: Log4jsModule,
      global: isGlobal,
      providers: [
        {
          provide: LOG4JS_OPTIONS,
          useValue: this.mergeOptions(options),
        },
        {
          provide: Log4jsService,
          useFactory: (options: Log4jsOptions) => {
            const logger = log4js.configure(options).getLogger();

            logger.setParseCallStackFunction(parseNestModuleCallStack);
            return new Log4jsService(logger);
          },
          inject: [LOG4JS_OPTIONS],
        },
      ],
      exports: [LOG4JS_OPTIONS, Log4jsService],
    };
  }

  static forRootAsync(options: Log4jsAsyncOptions): DynamicModule {
    return {
      module: Log4jsModule,
      imports: options.imports || [],
      providers: [
        ...this.createAsyncProviders(options),
        {
          provide: Log4jsService,
          useFactory: (options: Log4jsOptions) => {
            const logger = log4js.configure(options).getLogger();

            logger.setParseCallStackFunction(parseNestModuleCallStack);
            return new Log4jsService(logger);
          },
          inject: [LOG4JS_OPTIONS],
        },
      ],
      exports: [LOG4JS_OPTIONS, Log4jsService],
    };
  }

  private static createAsyncProviders(options: Log4jsAsyncOptions): Provider[] {
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

  private static createAsyncOptionsProvider(options: Log4jsAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: LOG4JS_OPTIONS,
        useFactory: async (...args: any[]) => {
          const config = await options.useFactory!(...args);
          return this.mergeOptions(config);
        },
        inject: options.inject || [],
      };
    }
    return {
      provide: LOG4JS_OPTIONS,
      useFactory: async (optionsFactory: Log4jsOptionsFactory) => {
        const config = await optionsFactory.createLog4jsOptions();
        return this.mergeOptions(config);
      },
      inject: [options.useExisting! || options.useClass!],
    };
  }

  private static mergeOptions(options: Partial<Log4jsOptions>): Log4jsOptions {
    const { appenders, categories, ...rest } = options;
    return {
      ...LOG4JS_DEFAULT_CONFIG,
      appenders: { ...LOG4JS_DEFAULT_CONFIG.appenders, ...appenders },
      categories: { ...LOG4JS_DEFAULT_CONFIG.categories, ...categories },
      ...rest,
    };
  }
}
