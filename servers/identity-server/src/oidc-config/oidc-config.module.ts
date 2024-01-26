import { Module, DynamicModule, Provider } from '@nestjs/common';
import { OidcAdapterModule } from '../oidc-adapter/oidc-adapter.module';
import { OidcConfigService } from './oidc-config.service';
import {
  OidcConfigOptions,
  OidcConfigAsyncOptions,
  OidcConfigOptionsFactory,
} from './interfaces/oidc-config-options.interface';
import { OIDC_CONFIG_OPTIONS } from './constants';

const defaultOptions: Partial<OidcConfigOptions> = {
  debug: false,
  path: '/oidc',
};

@Module({
  imports: [OidcAdapterModule],
  providers: [OidcConfigService],
  exports: [OidcConfigService],
})
export class OidcConfigModule {
  static forRoot(options: OidcConfigOptions): DynamicModule {
    const { isGlobal, ...restOptions } = options;
    return {
      module: OidcConfigModule,
      global: isGlobal,
      providers: [
        {
          provide: OIDC_CONFIG_OPTIONS,
          useValue: { ...defaultOptions, ...restOptions },
        },
      ],
    };
  }

  static forRootAsync(options: OidcConfigAsyncOptions): DynamicModule {
    return {
      module: OidcConfigModule,
      global: options.isGlobal,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options),
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
          return { ...defaultOptions, ...config };
        },
        inject: options.inject || [],
      };
    }
    return {
      provide: OIDC_CONFIG_OPTIONS,
      useFactory: async (optionsFactory: OidcConfigOptionsFactory) => {
        const config = await optionsFactory.createOidcConfigOptions();
        return { ...defaultOptions, ...config };
      },
      inject: [options.useExisting! || options.useClass!],
    };
  }
}
