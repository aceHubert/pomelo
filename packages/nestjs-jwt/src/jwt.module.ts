import { Inject, Logger, Module, DynamicModule, NestModule, Provider, MiddlewareConsumer } from '@nestjs/common';
import { JwtMiddleware } from './middlewares/jwt.middleware';
import { isNestMiddleware, usingFastify } from './utils/util';
import { JwtService } from './jwt.service';
import { JWT_OPTIONS } from './constants';

// Types
import type { JwtOptions, JwtAsyncOptions, JwtOptionsFactory } from './interfaces/jwt-options.interface';

@Module({})
export class JwtModule implements NestModule {
  private static logger = new Logger(JwtModule.name, { timestamp: true });

  constructor(@Inject(JWT_OPTIONS) private readonly options: JwtOptions) {}

  configure(consumer: MiddlewareConsumer) {
    if (this.options.disableMiddleware) return;

    this.options.logging && JwtModule.logger.debug('Apply JwtMiddleware for all routes');
    consumer.apply(JwtMiddleware).forRoutes(isNestMiddleware(consumer) && usingFastify(consumer) ? '(.*)' : '*');
  }

  static forRoot(options: JwtOptions): DynamicModule {
    this.assertEndpoint(options);

    return {
      module: JwtModule,
      global: options.isGlobal,
      providers: [
        {
          provide: JWT_OPTIONS,
          useValue: options,
        },
        JwtService,
      ],
      exports: [JWT_OPTIONS, JwtService],
    };
  }

  static forRootAsync(options: JwtAsyncOptions): DynamicModule {
    return {
      module: JwtModule,
      global: options.isGlobal,
      imports: options.imports || [],
      providers: [JwtService, ...this.createAsyncProviders(options)],
      exports: [JWT_OPTIONS, JwtService],
    };
  }

  private static createAsyncProviders(options: JwtAsyncOptions): Provider[] {
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

  private static createAsyncOptionsProvider(options: JwtAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: JWT_OPTIONS,
        useFactory: async (...args: any[]) => {
          const config = await options.useFactory!(...args);
          this.assertEndpoint(config);

          return config;
        },
        inject: options.inject || [],
      };
    }
    return {
      provide: JWT_OPTIONS,
      useFactory: async (optionsFactory: JwtOptionsFactory) => {
        const config = await optionsFactory.createJwtOptions();
        this.assertEndpoint(config);

        return config;
      },
      inject: [options.useExisting! || options.useClass!],
    };
  }

  private static assertEndpoint(options: JwtOptions) {
    if (!options.endpoint) {
      const errorMessage = `Missing "endpoint" option.`;
      options.logging && this.logger.error(errorMessage);
      throw new Error(errorMessage);
    } else {
      // trailing slash endpoint
      options.endpoint = options.endpoint.endsWith('/') ? options.endpoint : options.endpoint + '/';
    }
  }
}
