import { APP_GUARD } from '@nestjs/core';
import { DynamicModule, MiddlewareConsumer, Module, NestModule, Provider, Inject, RequestMethod } from '@nestjs/common';
import {
  AuthMultitenantMultiChannelController,
  AuthMultitenantController,
  AuthController,
  LoginCallbackController,
  TenantSwitchController,
} from './controllers';
import { GuestTokenGuard, TokenGuard, TenancyGuard } from './guards';
import { OidcModuleAsyncOptions, OidcModuleOptions, OidcOptionsFactory } from './interfaces';
import { LoginMiddleware } from './middlewares';
import { OidcService } from './oidc.service';
import { SessionSerializer } from './session.serializer';
import { mergeDefaults } from './utils/merge-defaults';
import { OIDC_MODULE_OPTIONS } from './oidc.constants';

@Module({})
export class OidcModule implements NestModule {
  constructor(@Inject(OIDC_MODULE_OPTIONS) private options: OidcModuleOptions) {}

  configure(consumer: MiddlewareConsumer) {
    this.options.disableMiddleware !== true &&
      consumer
        .apply(LoginMiddleware)
        .forRoutes(
          { path: '/login', method: RequestMethod.ALL },
          { path: '/:tenantId/login', method: RequestMethod.ALL },
          { path: '/:tenantId/:channelType/login', method: RequestMethod.ALL },
        );
  }

  static forRoot({ isGlobal, ...options }: OidcModuleOptions): DynamicModule {
    return {
      module: OidcModule,
      global: isGlobal,
      controllers:
        options.disableMiddleware === true
          ? []
          : [
              AuthController,
              AuthMultitenantController,
              AuthMultitenantMultiChannelController,
              LoginCallbackController,
              TenantSwitchController,
            ],
      providers: [
        {
          provide: OIDC_MODULE_OPTIONS,
          useValue: mergeDefaults(options),
        },
        SessionSerializer,
        TokenGuard,
        GuestTokenGuard,
        OidcService,
        {
          provide: APP_GUARD,
          useClass: TenancyGuard,
        },
      ],
      exports: [OIDC_MODULE_OPTIONS, OidcService],
    };
  }

  static forRootAsync(options: OidcModuleAsyncOptions): DynamicModule {
    return {
      module: OidcModule,
      global: options.isGlobal,
      controllers:
        options.disableMiddleware === true
          ? []
          : [
              AuthController,
              AuthMultitenantController,
              AuthMultitenantMultiChannelController,
              LoginCallbackController,
              TenantSwitchController,
            ],
      imports: options.imports,
      providers: [
        ...this.createAsyncProviders(options),
        SessionSerializer,
        TokenGuard,
        GuestTokenGuard,
        OidcService,
        {
          provide: APP_GUARD,
          useClass: TenancyGuard,
        },
      ],
      exports: [OIDC_MODULE_OPTIONS, OidcService],
    };
  }

  private static createAsyncProviders(options: OidcModuleAsyncOptions): Provider[] {
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

  private static createAsyncOptionsProvider(options: OidcModuleAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: OIDC_MODULE_OPTIONS,
        useFactory: async (...args: any[]) =>
          mergeDefaults({
            disableMiddleware: options.disableMiddleware,
            ...(await options.useFactory!(...args)),
          }),
        inject: options.inject || [],
      };
    }
    return {
      provide: OIDC_MODULE_OPTIONS,
      useFactory: async (optionsFactory: OidcOptionsFactory) =>
        mergeDefaults({
          disableMiddleware: options.disableMiddleware,
          ...(await optionsFactory.createModuleConfig()),
        }),
      inject: [options.useExisting! || options.useClass!],
    };
  }
}
