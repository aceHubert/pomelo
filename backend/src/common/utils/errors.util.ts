/**
 * 语法错误, 如无法完成置换
 */
export class SyntaxError extends Error {
  constructor(message: string) {
    super(message);

    Object.defineProperty(this, 'name', { value: 'SyntaxError' });
  }
}

/**
 * 输入参数错误
 */
export class UserInputError extends Error {
  constructor(message: string) {
    super(message);

    Object.defineProperty(this, 'name', { value: 'UserInputError' });
  }
}

/**
 * 验证错误，如方法不可操作，数据不可操作等
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);

    Object.defineProperty(this, 'name', { value: 'ValidationError' });
  }
}

/**
 * 认证错误
 */
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);

    Object.defineProperty(this, 'name', { value: 'AuthenticationError' });
  }
}

/**
 * 拒绝请求，如权限不足
 */
export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);

    Object.defineProperty(this, 'name', { value: 'ForbiddenError' });
  }
}

/**
 * 程序执行错误
 */
export class RuntimeError extends Error {
  constructor(message: string) {
    super(message);

    Object.defineProperty(this, 'name', { value: 'RuntimeError' });
  }
}
