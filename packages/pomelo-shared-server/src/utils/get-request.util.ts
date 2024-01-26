import { ExecutionContext } from '@nestjs/common';

export function getRequest<Req = any>(context: ExecutionContext) {
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
