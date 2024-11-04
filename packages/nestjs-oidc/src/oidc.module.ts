import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { DynamicModule, MiddlewareConsumer, Module, NestModule, Provider, Inject, RequestMethod } from '@nestjs/common';
import {
  AuthMultitenantMultiChannelController,
  AuthMultitenantController,
  AuthController,
  TenantSwitchController,
} from './controllers';
import { GuestTokenGuard, TokenGuard, TenancyGuard } from './guards';
import { MisdirectedExceptionFilter } from './filters/misdirected-exception.filter';
import { OidcModuleAsyncOptions, OidcModuleOptions, OidcOptionsFactory } from './interfaces';
import { LoginMiddleware } from './middlewares';
import { OidcService } from './oidc.service';
import { SessionSerializer } from './session.serializer';
import { mergeDefaults } from './utils/merge-defaults';
import { OIDC_MODULE_OPTIONS } from './oidc.constants';

const Controllers = [
  AuthController,
  AuthMultitenantController,
  AuthMultitenantMultiChannelController,
  TenantSwitchController,
];

const Provides = [
  {
    provide: APP_GUARD,
    useClass: TenancyGuard,
  },
  {
    provide: APP_FILTER,
    useClass: MisdirectedExceptionFilter,
  },
];

@Module({})
export class OidcModule implements NestModule {
  constructor(@Inject(OIDC_MODULE_OPTIONS) private options: OidcModuleOptions) {}

  configure(consumer: MiddlewareConsumer) {
    this.options.disableController !== true &&
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
      controllers: options.disableController === true ? [] : Controllers,
      providers: [
        {
          provide: OIDC_MODULE_OPTIONS,
          useValue: mergeDefaults(options),
        },
        SessionSerializer,
        TokenGuard,
        GuestTokenGuard,
        OidcService,
        ...(options.disableController === true ? [] : Provides),
      ],
      exports: [OIDC_MODULE_OPTIONS, OidcService],
    };
  }

  static forRootAsync(options: OidcModuleAsyncOptions): DynamicModule {
    return {
      module: OidcModule,
      global: options.isGlobal,
      controllers: options.disableController === true ? [] : Controllers,
      imports: options.imports,
      providers: [
        ...this.createAsyncProviders(options),
        SessionSerializer,
        TokenGuard,
        GuestTokenGuard,
        OidcService,
        ...(options.disableController === true ? [] : Provides),
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
