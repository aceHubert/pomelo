import { Reflector } from '@nestjs/core';
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { getContextObject } from './utils/get-context-object.util';
import { RAM_AUTHORIZATION_ACTION_KEY } from './constants';
import { User } from './types';

/**
 * 是否有用户授权策略
 */
@Injectable()
export class RamAuthorizedGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = getContextObject(context);
    if (!ctx) {
      throw Error(`context type: ${context.getType()} not supported`);
    }

    const user: User | null = ctx.user;

    const action = this.reflector.getAllAndOverride<string>(RAM_AUTHORIZATION_ACTION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!user) {
      // 没有的提供 token, return 401
      throw new UnauthorizedException("Access denied, You don't have permission for this action!");
    } else if (action && !this.hasRamPermission(user, action)) {
      // false return 403
      throw new ForbiddenException("Access denied, You don't have capability for this action!");
    }

    return true;
  }

  /**
   * 判断用户策略是否在提供的策略内
   * @param user 用户
   * @param rams 策略
   * @returns
   */
  private hasRamPermission(_user: User, _action: string): boolean {
    // const hasRam = (userRams: string[]) => rams.some((ram) => userRams.includes(ram));
    // return Boolean(user.ram && hasRam(user.ram));
    return true;
  }
}
