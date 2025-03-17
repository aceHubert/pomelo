import { NestModule, Module, DynamicModule, Provider, Inject, RequestMethod, MiddlewareConsumer } from '@nestjs/common';
import { AuthorizationService } from './authroized.service';
import { UserMiddleware } from './user.middleware';
import {
  AuthorizationOptions,
  AuthorizationAsyncOptions,
  AuthorizationOptionsFactory,
} from './interfaces/authorization-options.interface';
import { AUTHORIZATION_OPTIONS } from './constants';

const DefaultAuthorizationOptions: Partial<AuthorizationOptions> = {
  jwtHeaderParameters: {
    alg: 'RS256',
  },
  setUserinfoHeader: 'x-userinfo',
  userProperty: 'user',
};

@Module({})
export class AuthorizationModule implements NestModule {
  constructor(@Inject(AUTHORIZATION_OPTIONS) private readonly options: AuthorizationOptions) {}

  configure(consumer: MiddlewareConsumer) {
    this.options.disableMiddleware !== true &&
      consumer.apply(UserMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
  }

  static forRoot({ isGlobal, ...options }: AuthorizationOptions): DynamicModule {
    return {
      module: AuthorizationModule,
      global: isGlobal,
      providers: [
        {
          provide: AUTHORIZATION_OPTIONS,
          useValue: { ...DefaultAuthorizationOptions, ...options },
        },
        AuthorizationService,
      ],
      exports: [AUTHORIZATION_OPTIONS, AuthorizationService],
    };
  }

  static forRootAsync(options: AuthorizationAsyncOptions): DynamicModule {
    return {
      module: AuthorizationModule,
      global: options.isGlobal,
      imports: options.imports || [],
      providers: [...this.createAsyncProviders(options), AuthorizationService],
      exports: [AUTHORIZATION_OPTIONS, AuthorizationService],
    };
  }

  private static createAsyncProviders(options: AuthorizationAsyncOptions): Provider[] {
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

  private static createAsyncOptionsProvider(options: AuthorizationAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: AUTHORIZATION_OPTIONS,
        useFactory: async (...args: any[]) => {
          const config = await options.useFactory!(...args);
          return { ...DefaultAuthorizationOptions, ...config };
        },
        inject: options.inject || [],
      };
    }
    return {
      provide: AUTHORIZATION_OPTIONS,
      useFactory: async (optionsFactory: AuthorizationOptionsFactory) => {
        const config = await optionsFactory.createAuthorizationOptions();
        return { ...DefaultAuthorizationOptions, ...config };
      },
      inject: [options.useExisting! || options.useClass!],
    };
  }
}
