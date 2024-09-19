import { Resolver, Mutation, Subscription, Args, ID } from '@nestjs/graphql';
import { VoidResolver } from 'graphql-scalars';
import { MessageSubscriotion } from './models/message.model';
import { MessageService } from './message.service';

@Resolver()
export class MessageResolver {
  constructor(private readonly messageService: MessageService) {}

  @Subscription((returns) => MessageSubscriotion, {
    nullable: true,
    description: 'Message subscription',
    async filter({ includes = [], excludes = [] }, variables, context) {
      // 订阅用户不存在
      let sub: string;
      if (!(sub = context.user?.sub)) return false;

      // 排除的用户
      if (excludes) {
        if (Array.isArray(excludes) && excludes.length && excludes.some((userId) => userId === sub)) {
          return false;
        } else if (typeof excludes === 'function' && (await excludes(sub))) {
          return false;
        }
      }

      // 包含的用户
      if (includes) {
        if (Array.isArray(includes) && includes.length && !includes.some((userId) => userId === sub)) {
          return false;
        } else if (typeof includes === 'function' && !(await includes(sub))) {
          return false;
        }
      }

      // 所有用户
      return true;
    },
    resolve: ({ message }) => message,
  })
  onMessage() {
    return this.messageService.asyncIterator();
  }

  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Send message' })
  async sendMessage(
    @Args('message', { type: () => String }) message: string,
    @Args('href', { type: () => String, nullable: true, description: 'Url to redirect' }) href: string,
    @Args('includes', { type: () => [ID!], nullable: true, description: 'Include user id(s)' }) includes: string[],
    @Args('excludes', { type: () => [ID!], nullable: true, description: 'Exclude user id(s)' }) excludes: string[],
  ): Promise<void> {
    await this.messageService.publish({ content: message, to: href }, { includes, excludes });
  }
}
