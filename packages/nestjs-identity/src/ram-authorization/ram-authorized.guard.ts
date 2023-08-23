import { Reflector } from '@nestjs/core';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { IUser } from '../interfaces/user.interface';
import { getContextObject } from '../utils/get-context-object.util';
import { AuthenticationError, ForbiddenError } from '../errors';
import { AUTHORIZATION_RAM_ACTION_KEY, ALLOWANONYMOUS_KEY } from '../constants';

/**
 * 是否有用户授权策略
 */
@Injectable()
export class RamAuthorizedGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const anonymous = this.reflector.getAllAndOverride<boolean>(ALLOWANONYMOUS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // 如果匿名，则直接返回
    if (anonymous === true) {
      return true;
    }

    const ctx = getContextObject(context);
    if (!ctx) {
      throw Error(`context type: ${context.getType()} not supported`);
    }

    const user: IUser | null = ctx.user;

    const action = this.reflector.getAllAndOverride<string>(AUTHORIZATION_RAM_ACTION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // no @RamAuthorized
    if (!action) {
      return true;
    }

    if (!user) {
      // 没有的提供 token, return 401
      throw new AuthenticationError("Access denied, You don't have permission for this action!");
    } else if (!this.hasRamPermission(user, action)) {
      // false return 403
      throw new ForbiddenError("Access denied, You don't have capability for this action!");
    }

    return true;
  }

  /**
   * 判断用户策略是否在提供的策略内
   * @param user 用户
   * @param rams 策略
   * @returns
   */
  private hasRamPermission(_user: IUser, _action: string): boolean {
    // const hasRam = (userRams: string[]) => rams.some((ram) => userRams.includes(ram));
    // return Boolean(user.ram && hasRam(user.ram));
    return true;
  }
}
