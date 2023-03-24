import { Reflector } from '@nestjs/core';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { getContextObject } from '../utils/get-context-object.util';
import { AuthenticationError, ForbiddenError } from '../utils/errors.util';
import { AUTHORIZATION_RAM_ACTION_KEY, ALLOWANONYMOUS_KEY } from '../constants';

/**
 * 是否有用户授权策略
 */
@Injectable()
export class RamAuthorizedGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly i18nService: I18nService) {}

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

    const user: JwtPayload | null = ctx.user;
    const lang: string | undefined = ctx.i18nLang;

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
      throw new AuthenticationError(
        await this.i18nService.tv('error.unauthorized', `Access denied, You don't permission for this action!`, {
          lang,
        }),
      );
    } else if (!this.hasRamPermission(user, action)) {
      // false return 403
      throw new ForbiddenError(
        await this.i18nService.tv('error.forbidden', `Access denied, You don't capability for this action!`, {
          lang,
        }),
      );
    }

    return true;
  }

  /**
   * 判断用户策略是否在提供的策略内
   * @param user 用户
   * @param rams 策略
   * @returns
   */
  private hasRamPermission(user: JwtPayload, _action: string): boolean {
    // const hasRam = (userRams: string[]) => rams.some((ram) => userRams.includes(ram));
    // return Boolean(user.ram && hasRam(user.ram));
    // TODO: 暂时只允许公司员工访问
    return user.eid === '11111111-1111-1111-1111-111111111111';
  }
}
