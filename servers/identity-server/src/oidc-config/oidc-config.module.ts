import { Module, DynamicModule, Provider } from '@nestjs/common';
import { OidcConfigService } from './oidc-config.service';
import {
  OidcConfigOptions,
  OidcConfigAsyncOptions,
  OidcConfigOptionsFactory,
} from './interfaces/oidc-config-options.interface';
import { OIDC_CONFIG_OPTIONS } from './constants';

@Module({})
export class OidcConfigModule {
  static forRoot(options: OidcConfigOptions): DynamicModule {
    const { isGlobal, ...restOptions } = options;
    return {
      module: OidcConfigModule,
      global: isGlobal,
      providers: [
        {
          provide: OIDC_CONFIG_OPTIONS,
          useValue: restOptions,
        },
        OidcConfigService,
      ],
      exports: [OIDC_CONFIG_OPTIONS, OidcConfigService],
    };
  }

  static forRootAsync(options: OidcConfigAsyncOptions): DynamicModule {
    return {
      module: OidcConfigModule,
      global: options.isGlobal,
      imports: options.imports || [],
      providers: [...this.createAsyncProviders(options), OidcConfigService],
      exports: [OIDC_CONFIG_OPTIONS, OidcConfigService],
    };
  }

  private static createAsyncProviders(options: OidcConfigAsyncOptions): Provider[] {
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

  private static createAsyncOptionsProvider(options: OidcConfigAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: OIDC_CONFIG_OPTIONS,
        useFactory: async (...args: any[]) => {
          const config = await options.useFactory!(...args);
          return config;
        },
        inject: options.inject || [],
      };
    }
    return {
      provide: OIDC_CONFIG_OPTIONS,
      useFactory: async (optionsFactory: OidcConfigOptionsFactory) => {
        const config = await optionsFactory.createOidcConfigOptions();
        return config;
      },
      inject: [options.useExisting! || options.useClass!],
    };
  }
}
