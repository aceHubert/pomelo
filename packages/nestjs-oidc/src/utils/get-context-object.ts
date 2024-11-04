import { ExecutionContext, ArgumentsHost } from '@nestjs/common';

export function getContextObject<Req = any>(context: ExecutionContext | ArgumentsHost) {
  switch (context.getType<string>()) {
    case 'http':
      return context.switchToHttp().getRequest<Req>();
    case 'graphql':
      const [, , cxt] = context.getArgs<[any, any, Req]>();
      return cxt;
    case 'rpc':
      return context.switchToRpc().getContext<Req>();
    default:
      return null;
  }
}
