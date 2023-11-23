import { APP_GUARD } from '@nestjs/core';
import { DynamicModule, MiddlewareConsumer, Module, NestModule, Provider, RequestMethod } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import {
  AuthMultitenantMultiChannelController,
  AuthMultitenantController,
  AuthController,
  LoginCallbackController,
  TenantSwitchController,
} from './controllers';
import { GuestTokenGuard, TokenGuard, TenancyGuard } from './guards';
import { OidcModuleAsyncOptions, OidcModuleOptions, OidcOptionsFactory } from './interfaces';
import { UserMiddleware, LoginMiddleware } from './middlewares';
import { UserInfoService } from './userinfo.service';
import { ClaimsService } from './claims.service';
import { OidcService } from './oidc.service';
import { OIDC_MODULE_OPTIONS } from './oidc.constants';
import { mergeDefaults } from './utils';
import { SessionSerializer } from './utils/session.serializer';

@Module({
  imports: [JwtModule.register({})],
  providers: [
    SessionSerializer,
    TokenGuard,
    GuestTokenGuard,
    UserInfoService,
    ClaimsService,
    OidcService,
    {
      provide: APP_GUARD,
      useClass: TenancyGuard,
    },
  ],
  exports: [OIDC_MODULE_OPTIONS, UserInfoService, ClaimsService, OidcService],
})
export class OidcModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserMiddleware)
      .exclude({ path: '/user', method: RequestMethod.GET })
      .forRoutes({ path: '*', method: RequestMethod.ALL });

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
      providers: [
        {
          provide: OIDC_MODULE_OPTIONS,
          useValue: mergeDefaults(options),
        },
      ],
      controllers:
        options.disableController === true
          ? []
          : [
              AuthController,
              AuthMultitenantController,
              AuthMultitenantMultiChannelController,
              LoginCallbackController,
              TenantSwitchController,
            ],
    };
  }

  static forRootAsync(options: OidcModuleAsyncOptions): DynamicModule {
    return {
      module: OidcModule,
      global: options.isGlobal,
      imports: options.imports,
      providers: [...this.createAsyncProviders(options)],
      controllers:
        options.disableController === true
          ? []
          : [
              AuthController,
              AuthMultitenantController,
              AuthMultitenantMultiChannelController,
              LoginCallbackController,
              TenantSwitchController,
            ],
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
            disableController: options.disableController,
            ...(await options.useFactory!(...args)),
          }),
        inject: options.inject || [],
      };
    }
    return {
      provide: OIDC_MODULE_OPTIONS,
      useFactory: async (optionsFactory: OidcOptionsFactory) =>
        mergeDefaults({
          disableController: options.disableController,
          ...(await optionsFactory.createModuleConfig()),
        }),
      inject: [options.useExisting! || options.useClass!],
    };
  }
}
