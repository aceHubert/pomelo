import { Inject, Injectable } from '@nestjs/common';
import { MessageOptions } from './interfaces/message-options.interface';
import { Message } from './interfaces/message.interface';
import { MESSAGE_OPTIONS, MessageTrigger } from './constants';

@Injectable()
export class MessageService {
  constructor(@Inject(MESSAGE_OPTIONS) private readonly options: MessageOptions) {}

  publish(message: Message) {
    return this.options.pubSub.publish(MessageTrigger.Message, {
      includes: message.includes,
      excludes: message.excludes,
      [MessageTrigger.Message]: message.message,
    });
  }

  subscribe<T = any>(triggerName: string, onMessage: (message: T) => void, options: Object = {}) {
    return this.options.pubSub.subscribe(triggerName, onMessage, options);
  }

  unubscribe(subId: number) {
    return this.options.pubSub.unsubscribe(subId);
  }

  asyncIterator() {
    return this.options.pubSub.asyncIterator(MessageTrigger.Message);
  }
}
