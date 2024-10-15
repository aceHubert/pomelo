import { Inject, Injectable } from '@nestjs/common';
import { MessageOptions } from './interfaces/message-options.interface';
import { TriggerName, ContentMessage, EventMessage } from './interfaces/message.interface';
import { MESSAGE_OPTIONS } from './constants';

@Injectable()
export class MessageService {
  constructor(@Inject(MESSAGE_OPTIONS) private readonly options: MessageOptions) {}

  publish(
    message: ContentMessage | EventMessage,
    {
      includes,
      excludes,
      triggerName = TriggerName.Message,
    }: {
      includes?: Array<string | number> | ((sub: string) => boolean | Promise<boolean>);
      excludes?: Array<string | number> | ((sub: string) => boolean | Promise<boolean>);
      triggerName?: TriggerName;
    } = {},
  ) {
    return this.options.pubSub.publish(triggerName, {
      includes,
      excludes,
      message,
    });
  }

  subscribe<T = any>(triggerName: string, onMessage: (message: T) => void, options: Object = {}) {
    return this.options.pubSub.subscribe(triggerName, onMessage, options);
  }

  unubscribe(subId: number) {
    return this.options.pubSub.unsubscribe(subId);
  }

  asyncIterator() {
    return this.options.pubSub.asyncIterator(Object.values(TriggerName));
  }
}
