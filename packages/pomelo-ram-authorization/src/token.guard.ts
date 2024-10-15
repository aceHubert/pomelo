import { Reflector } from '@nestjs/core';
import {
  Inject,
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import { RamAuthorizationOptions } from './interfaces/ram-authorization-options.interface';
import { getContextObject } from './utils/get-context-object';
import { RAM_AUTHORIZATION_OPTIONS, RAM_AUTHORIZATION_ACTION_KEY } from './constants';

/**
 * 是否有用户授权策略
 */
@Injectable()
export class TokenGuard implements CanActivate {
  constructor(
    @Inject(RAM_AUTHORIZATION_OPTIONS) private readonly options: RamAuthorizationOptions,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = getContextObject(context);
    if (!ctx) {
      throw Error(`context type: ${context.getType()} not supported`);
    }

    const action = this.reflector.getAllAndOverride<string>(RAM_AUTHORIZATION_ACTION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const user = ctx[this.options.userProperty!] as Record<string, any> | undefined;
    if (!user) {
      // 没有的提供 token, return 401
      throw new UnauthorizedException("Access denied, You don't have permission for this action!");
    } else if (action && !this.hasRamPermission(user, action)) {
      // false return 403
      throw new ForbiddenException("Access denied, You don't have capability for this action!");
    }

    const type = context.getType<string>();

    // graphql 判断返回实体字段是否有权限
    if (type === 'graphql') {
      const { GqlExecutionContext } = loadPackage('@nestjs/graphql', 'TokenRamAuthoricationGuard', () =>
        require('@nestjs/graphql'),
      );
      const info = GqlExecutionContext.create(context).getInfo();

      /**
       * 这里未使用 FieldMiddleware 原因在于中间件对每个 field 是隔离的，当其中 field 验证失败时，ResoloveField 会继续执行
       * https://docs.nestjs.com/graphql/extensions
       */
      // @FieldRamAuthorized
      const fieldAction = this.resolveGraphqlOutputFieldsAction(info);
      for (const field in fieldAction) {
        if (!user || !this.hasRamPermission(user, fieldAction[field])) {
          // false return 403
          throw new UnauthorizedException(`Access denied, You don't capability for field "${field}"!)`);
        }
      }
    }

    return true;
  }

  /**
   * 获取 Graphql Output fields 的角色权限
   * @param info GraphQLResolveInfo
   */
  resolveGraphqlOutputFieldsAction(info: any): { [field: string]: string } {
    const { isObjectType, isInterfaceType, isWrappingType } = loadPackage(
      'graphql',
      'ResolveGraphqlOutputFieldsAction',
      () => require('graphql'),
    );
    const { parse } = loadPackage('graphql-parse-resolve-info', 'ResolveGraphqlOutputFieldsAction', () =>
      require('graphql-parse-resolve-info'),
    );
    const parsedResolveInfoFragment = parse(info, { keepRoot: false, deep: true });

    if (!parsedResolveInfoFragment) {
      return {};
    }

    const rootFields = parsedResolveInfoFragment.fieldsByTypeName
      ? parsedResolveInfoFragment.fieldsByTypeName
      : parsedResolveInfoFragment;

    return resolveFields(rootFields, info.returnType);

    function resolveFields(
      fieldsByTypeName: any,
      type: any,
      parentTypeName?: string,
      fieldAction: { [field: string]: string } = {},
    ) {
      const returnType = getUnWrappingType(type);

      // todo: isUnionType
      if (isObjectType(returnType) || isInterfaceType(returnType)) {
        for (const key in fieldsByTypeName[returnType.name]) {
          const fields = returnType.getFields();
          const field = fieldsByTypeName[returnType.name][key];
          if (fields[field.name]?.extensions?.action) {
            fieldAction[`${parentTypeName ? parentTypeName + '.' : ''}${field.name}`] = fields[field.name].extensions
              ?.action as string;
          }
          Object.keys(field.fieldsByTypeName).length &&
            resolveFields(field.fieldsByTypeName, fields[field.name].type, field.name, fieldAction);
        }
      }
      return fieldAction;
    }

    function getUnWrappingType(type: any): any {
      if (isWrappingType(type)) {
        return getUnWrappingType(type.ofType);
      }
      return type;
    }
  }

  /**
   * 判断用户策略是否在提供的策略内
   * @param user 用户
   * @param rams 策略
   * @returns
   */
  private hasRamPermission(user: Record<string, any>, action: string): boolean {
    // TODO: RAM 策略判断
    console.log('ram check', user.ramsClaim, action);
    return true;
    // const hasRam = (userRamsClaim: string[]): boolean => {
    //   // TODO: RAM 策略判断
    //   // rams.some((ram) => userRams.includes(ram))
    //   console.log('ram check', userRamsClaim, action);
    //   return true;
    // };
    // const userRamsClaim = user.ramsClaim as string[] | undefined;
    // return Boolean(userRamsClaim?.length && hasRam(userRamsClaim));
  }
}
