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
