import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { getRequest } from '../utils/get-request.util';
import { RequestUser } from '../types';

/**
 * 当前请求的 JwtPayload & lang
 */
export const User = createParamDecorator((field: keyof RequestUser, context: ExecutionContext) => {
  const request = getRequest(context);

  if (!request) {
    throw Error(`context type: ${context.getType()} not supported`);
  }

  const user: RequestUser = {
    ...request.user,
    lang: request.i18nLang, // nestjs-i18n
  };

  return field ? user[field] : user ? user : void 0;
});
