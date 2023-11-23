import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { getContextObject } from '../utils/get-context-object.util';
import { RequestUser } from '../types';

/**
 * 当前请求的 JwtPayload & lang
 */
export const User = createParamDecorator((field: keyof RequestUser, context: ExecutionContext) => {
  const ctx = getContextObject(context);

  if (!ctx) {
    throw Error(`context type: ${context.getType()} not supported`);
  }

  const user: RequestUser = {
    ...ctx.user,
    lang: ctx.i18nLang, // nestjs-i18n
  };

  return field ? user[field] : ctx.user ? user : void 0;
});
