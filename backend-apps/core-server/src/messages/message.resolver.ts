import { Resolver, Subscription } from '@nestjs/graphql';
import { Authorized } from 'nestjs-identity';
import { MessageSubscriotion } from './models/message.model';
import { MessageService } from './message.service';

@Authorized()
@Resolver()
export class MessageResolver {
  constructor(private readonly messageService: MessageService) {}

  @Subscription((returns) => MessageSubscriotion, {
    description: 'Message subscription',
    async filter({ includes = [], excludes = [] }, variables, context) {
      // 订阅用户不存在
      if (!context.user?.sub) {
        return false;
      }
      // 排除的用户
      if (excludes) {
        if (Array.isArray(excludes) && excludes.length && excludes.some((userId) => userId === context.user.sub)) {
          return false;
        }

        if (typeof excludes === 'function' && (await excludes(context.user!.sub))) {
          return false;
        }
      }

      // 包含的用户
      if (includes) {
        if (Array.isArray(includes) && includes.length && !includes.some((userId) => userId === context.user.sub)) {
          return false;
        }

        if (typeof includes === 'function' && !(await includes(context.user!.sub))) {
          return false;
        }
      }

      // 所有用户
      return true;
    },
  })
  message() {
    return this.messageService.asyncIterator();
  }
}
