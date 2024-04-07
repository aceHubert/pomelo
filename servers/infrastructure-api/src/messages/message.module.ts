import { Module, DynamicModule, Provider } from '@nestjs/common';
import { MessageOptions, MessageAsyncOptions, MessageOptionsFactory } from './interfaces/message-options.interface';
import { MessageResolver } from './message.resolver';
import { MessageService } from './message.service';
import { MESSAGE_OPTIONS } from './constants';

// Types

@Module({})
export class MessageModule {
  static forRoot(options: MessageOptions): DynamicModule {
    const { isGlobal, ...restOptions } = options;
    return {
      module: MessageModule,
      global: isGlobal,
      providers: [
        {
          provide: MESSAGE_OPTIONS,
          useValue: restOptions,
        },
        MessageService,
        MessageResolver,
      ],
      exports: [MessageService],
    };
  }

  static forRootAsync(options: MessageAsyncOptions): DynamicModule {
    return {
      module: MessageModule,
      global: options.isGlobal,
      imports: options.imports || [],
      providers: [...this.createAsyncProviders(options), MessageService, MessageResolver],
      exports: [MessageService],
    };
  }

  private static createAsyncProviders(options: MessageAsyncOptions): Provider[] {
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

  private static createAsyncOptionsProvider(options: MessageAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: MESSAGE_OPTIONS,
        useFactory: async (...args: any[]) => {
          const config = await options.useFactory!(...args);
          return config;
        },
        inject: options.inject || [],
      };
    }
    return {
      provide: MESSAGE_OPTIONS,
      useFactory: async (optionsFactory: MessageOptionsFactory) => {
        const config = await optionsFactory.createMessageOptions();
        return config;
      },
      inject: [options.useExisting! || options.useClass!],
    };
  }
}
