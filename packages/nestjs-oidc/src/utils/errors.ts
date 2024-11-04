import { UnauthorizedException } from '@nestjs/common';

/**
 * TokenGuard Exception
 */
export class UnauthorizedError extends UnauthorizedException {
  redirect: boolean;

  constructor(objectOrError?: string | object | any, redirect = false) {
    super(objectOrError);
    this.name = 'UnauthorizedError';
    this.redirect = redirect;
  }
}
