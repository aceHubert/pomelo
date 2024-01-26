import { createParamDecorator, BadRequestException, ExecutionContext } from '@nestjs/common';

/**
 * Make @Query required
 */
export const QueryRequired = createParamDecorator((key: string, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest();

  if (!request) {
    throw Error(`context type: ${context.getType()} not supported`);
  }

  const value = request.query[key];

  if (value === undefined) {
    throw new BadRequestException(`Missing required query key "${key}"`);
  }

  return value;
});
