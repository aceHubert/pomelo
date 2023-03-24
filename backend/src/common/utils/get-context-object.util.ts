/* eslint-disable no-case-declarations */
import { ExecutionContext } from '@nestjs/common';

export function getContextObject(context: ExecutionContext): any {
  switch (context.getType<string>()) {
    case 'http':
      return context.switchToHttp().getRequest();
    case 'graphql':
      const [, , cxt] = context.getArgs();
      return cxt;
    case 'rpc':
      return context.switchToRpc().getContext();
    default:
      return null;
  }
}
