import { Global, Module, DynamicModule, Provider } from '@nestjs/common';
import {
  AuthorizationOptions,
  AuthorizationAsyncOptions,
  AuthorizationOptionsFactory,
} from './interfaces/authorization-options.interface';
import { AUTHORIZATION_OPTIONS } from './constants';

const DefaultAuthorizationOptions: Partial<AuthorizationOptions> = {
  userProperty: 'user',
};

@Global()
@Module({
  providers: [
    {
      provide: AUTHORIZATION_OPTIONS,
      useValue: DefaultAuthorizationOptions,
    },
  ],
  exports: [AUTHORIZATION_OPTIONS],
})
export class AuthorizationModule {
  static forRoot(options: AuthorizationOptions): DynamicModule {
    return {
      module: AuthorizationModule,
      global: true,
      providers: [
        {
          provide: AUTHORIZATION_OPTIONS,
          useValue: { ...DefaultAuthorizationOptions, ...options },
        },
      ],
    };
  }

  static forRootAsync(options: AuthorizationAsyncOptions): DynamicModule {
    return {
      module: AuthorizationModule,
      global: true,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options),
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
