import { createParamDecorator, BadRequestException, ExecutionContext } from '@nestjs/common';

/**
 * Make @Query required
 */
export const QueryRequired = createParamDecorator((key: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();

  const value = request.query[key];

  if (value === undefined) {
    throw new BadRequestException(`Missing required query param: '${key}'`);
  }

  return value;
});
