import { ModuleMetadata, Type } from '@nestjs/common';
import { PubSubEngine } from 'graphql-subscriptions';

export interface MessageOptions {
  /**
   * PubSub engine
   */
  pubSub: PubSubEngine;
  /**
   * is global module
   */
  isGlobal?: boolean;
}

export interface MessageOptionsFactory {
  createMessageOptions(): Promise<MessageOptions> | MessageOptions;
}

export interface MessageAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  /**
   * is global module
   */
  isGlobal?: boolean;
  useExisting?: Type<MessageOptionsFactory>;
  useClass?: Type<MessageOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<MessageOptions> | MessageOptions;
  inject?: any[];
}
