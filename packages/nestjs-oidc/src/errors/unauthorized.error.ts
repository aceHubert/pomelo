import { HttpStatus } from '@nestjs/common';

export type ErrorLike = Error | { message: string };

type ErrorCode = 'invalid_token' | 'revoked_token';

export class UnauthorizedError extends Error {
  readonly status: number;
  readonly inner: ErrorLike;
  readonly code: string;

  constructor(code: ErrorCode, error: ErrorLike) {
    super(error.message);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
    this.code = code;
    this.status = HttpStatus.UNAUTHORIZED;
    this.name = 'UnauthorizedError';
    this.inner = error;
  }
}
