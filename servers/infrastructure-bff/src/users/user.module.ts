import { Module, DynamicModule, Provider } from '@nestjs/common';
import { OptionModule } from '@/options/option.module';
import { MailController } from './mail.controller';
import { SocialController } from './social.controller';
import { UserController } from './user.controller';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { UserMailService } from './mail.service';
import { SocialService } from './social.service';
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
      imports: [OptionModule],
      controllers: [UserController, MailController, SocialController],
      providers: [
        {
          provide: USER_OPTIONS,
          useValue: restOptions,
        },
        UserService,
        UserMailService,
        SocialService,
        UserResolver,
      ],
      exports: [UserService, SocialService],
    };
  }

  static forRootAsync(options: UserAsyncOptions): DynamicModule {
    return {
      module: UserModule,
      global: options.isGlobal,
      imports: [OptionModule, ...(options.imports || [])],
      controllers: [UserController, MailController, SocialController],
      providers: [...this.createAsyncProviders(options), UserService, UserMailService, SocialService, UserResolver],
      exports: [UserService, SocialService],
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
