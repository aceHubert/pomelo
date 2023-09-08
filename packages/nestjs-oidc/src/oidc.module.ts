import fetch from 'node-fetch';
import { Inject, Logger, Module, DynamicModule, NestModule, Provider, MiddlewareConsumer } from '@nestjs/common';
import { OidcMiddleware } from './oidc.middleware';
import {
  OidcOptions,
  AdjustOidcOptions,
  OidcAsyncOptions,
  OidcOptionsFactory,
} from './interfaces/oidc-options.interface';
import { OidcMetadata } from './interfaces/oidc-metadata.interface';
import { OidcService } from './oidc.service';
import { isNestMiddleware, usingFastify } from './utils';
import { OIDC_OPTIONS } from './constants';

@Module({
  providers: [OidcService],
  exports: [OIDC_OPTIONS, OidcService],
})
export class OidcModule implements NestModule {
  private static logger = new Logger(OidcModule.name, { timestamp: true });

  constructor(@Inject(OIDC_OPTIONS) private readonly options: AdjustOidcOptions) {}

  configure(consumer: MiddlewareConsumer) {
    if (this.options.disableMiddleware) return;

    this.options.logging && OidcModule.logger.debug('Apply OidcMiddleware for all routes');
    consumer.apply(OidcMiddleware).forRoutes(isNestMiddleware(consumer) && usingFastify(consumer) ? '(.*)' : '*');
  }

  static forRoot(options: OidcOptions): DynamicModule {
    this.assertEndpoint(options);

    const { isGlobal, ...restOptions } = options;

    return {
      module: OidcModule,
      global: isGlobal,
      providers: [
        {
          provide: OIDC_OPTIONS,
          useFactory: async () => this.adjustOptions(restOptions),
        },
      ],
    };
  }

  static forRootAsync(options: OidcAsyncOptions): DynamicModule {
    return {
      module: OidcModule,
      global: options.isGlobal,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options),
    };
  }

  private static createAsyncProviders(options: OidcAsyncOptions): Provider[] {
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

  private static createAsyncOptionsProvider(options: OidcAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: OIDC_OPTIONS,
        useFactory: async (...args: any[]) => {
          const config = await options.useFactory!(...args);
          this.assertEndpoint(config);

          return this.adjustOptions(config);
        },
        inject: options.inject || [],
      };
    }
    return {
      provide: OIDC_OPTIONS,
      useFactory: async (optionsFactory: OidcOptionsFactory) => {
        const config = await optionsFactory.createOidcOptions();
        this.assertEndpoint(config);

        return this.adjustOptions(config);
      },
      inject: [options.useExisting! || options.useClass!],
    };
  }

  private static async adjustOptions({ endpoint, ...options }: OidcOptions): Promise<AdjustOidcOptions> {
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

  private static assertEndpoint(options: OidcOptions) {
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
