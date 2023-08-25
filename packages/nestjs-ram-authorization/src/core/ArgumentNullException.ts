import { HttpStatus } from '@nestjs/common';

export class ArgumentNullException extends Error {
  readonly status: number;

  constructor(argumentName: string) {
    super(`Argument "${argumentName}" is missing!`);
    Object.setPrototypeOf(this, ArgumentNullException.prototype);
    this.status = HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
