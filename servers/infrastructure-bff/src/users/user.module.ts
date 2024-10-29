import { Module, DynamicModule, Provider } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { UserOptions, UserOptionsFactory, UserAsyncOptions } from './interfaces/user-options.interface';
import { USER_OPTIONS } from './constants';
import './enums/registered.enum';

@Module({})
export class UserModule {
  static forRoot(options: UserOptions): DynamicModule {
    const { isGlobal, ...restOptions } = options;
    return {
      module: UserModule,
      global: isGlobal,
      controllers: [UserController],
      providers: [
        {
          provide: USER_OPTIONS,
          useValue: restOptions,
        },
        UserService,
        UserResolver,
      ],
      exports: [UserService],
    };
  }

  static forRootAsync(options: UserAsyncOptions): DynamicModule {
    return {
      module: UserModule,
      global: options.isGlobal,
      imports: options.imports || [],
      controllers: [UserController],
      providers: [...this.createAsyncProviders(options), UserService, UserResolver],
      exports: [UserService],
    };
  }

  private static createAsyncProviders(options: UserAsyncOptions): Provider[] {
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

  private static createAsyncOptionsProvider(options: UserAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: USER_OPTIONS,
        useFactory: async (...args: any[]) => {
          const config = await options.useFactory!(...args);
          return config;
        },
        inject: options.inject || [],
      };
    }
    return {
      provide: USER_OPTIONS,
      useFactory: async (optionsFactory: UserOptionsFactory) => {
        const config = await optionsFactory.createUserOptions();
        return config;
      },
      inject: [options.useExisting! || options.useClass!],
    };
  }
}
