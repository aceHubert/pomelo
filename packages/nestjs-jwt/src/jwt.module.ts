import fetch from 'node-fetch';
import { Inject, Logger, Module, DynamicModule, NestModule, Provider, MiddlewareConsumer } from '@nestjs/common';
import { JwtMiddleware } from './middlewares/jwt.middleware';
import { JwtOptions, AdjustJwtOptions, JwtAsyncOptions, JwtOptionsFactory } from './interfaces/jwt-options.interface';
import { OidcMetadata } from './interfaces/oidc-metadata.interface';
import { JwtService } from './jwt.service';
import { isNestMiddleware, usingFastify } from './utils/util';
import { JWT_OPTIONS } from './constants';

@Module({
  providers: [JwtService],
  exports: [JWT_OPTIONS, JwtService],
})
export class JwtModule implements NestModule {
  private static logger = new Logger(JwtModule.name, { timestamp: true });

  constructor(@Inject(JWT_OPTIONS) private readonly options: AdjustJwtOptions) {}

  configure(consumer: MiddlewareConsumer) {
    if (this.options.disableMiddleware) return;

    this.options.logging && JwtModule.logger.debug('Apply JwtMiddleware for all routes');
    consumer.apply(JwtMiddleware).forRoutes(isNestMiddleware(consumer) && usingFastify(consumer) ? '(.*)' : '*');
  }

  static forRoot(options: JwtOptions): DynamicModule {
    this.assertEndpoint(options);

    const { isGlobal, ...restOptions } = options;

    return {
      module: JwtModule,
      global: isGlobal,
      providers: [
        {
          provide: JWT_OPTIONS,
          useFactory: async () => {
            this.adjustOptions(restOptions);
          },
        },
      ],
    };
  }

  static forRootAsync(options: JwtAsyncOptions): DynamicModule {
    return {
      module: JwtModule,
      global: options.isGlobal,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options),
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

          return this.adjustOptions(config);
        },
        inject: options.inject || [],
      };
    }
    return {
      provide: JWT_OPTIONS,
      useFactory: async (optionsFactory: JwtOptionsFactory) => {
        const config = await optionsFactory.createJwtOptions();
        this.assertEndpoint(config);

        return this.adjustOptions(config);
      },
      inject: [options.useExisting! || options.useClass!],
    };
  }

  private static async adjustOptions({ endpoint, ...options }: JwtOptions): Promise<AdjustJwtOptions> {
    const response = await fetch(endpoint + '.well-known/openid-configuration');
    const metadata = (await response.json()) as OidcMetadata;
    return {
      ...metadata,
      ...options,
      jwksRsa: {
        ...options.jwksRsa,
        jwksUri: options.jwksRsa?.jwksUri ?? metadata.jwks_uri,
      },
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
