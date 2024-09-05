import { HttpStatus } from '@nestjs/common';

/**
 * 语法错误, 如无法完成置换
 */
export class SyntaxError extends Error {
  readonly status: number;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, SyntaxError.prototype);
    this.status = HttpStatus.BAD_REQUEST;
    this.name = 'SyntaxError';
  }
}

/**
 * 输入参数错误
 */
export class UserInputError extends Error {
  readonly status: number;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, UserInputError.prototype);
    this.status = HttpStatus.BAD_REQUEST;
    this.name = 'UserInputError';
  }
}

/**
 * 验证错误，如方法不可操作，数据不可操作等
 */
export class ValidationError extends Error {
  readonly status: number;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ValidationError.prototype);
    this.status = HttpStatus.METHOD_NOT_ALLOWED;
    this.name = 'ValidationError';
  }
}

/**
 * 拒绝请求，如权限不足
 */
export class ForbiddenError extends Error {
  readonly status: number;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
    this.status = HttpStatus.FORBIDDEN;
    this.name = 'RuntimeError';
  }
}

/**
 * 程序执行错误
 */
export class RuntimeError extends Error {
  readonly status: number;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, RuntimeError.prototype);
    this.status = HttpStatus.INTERNAL_SERVER_ERROR;
    this.name = 'RuntimeError';
  }
}

export class NotFoundError extends Error {
  readonly status: number;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, NotFoundError.prototype);
    this.status = HttpStatus.NOT_FOUND;
    this.name = 'NotFoundError';
  }
}
