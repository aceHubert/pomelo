import { Reflector } from '@nestjs/core';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext, GqlContextType } from '@nestjs/graphql';
import { GraphQLResolveInfo, GraphQLOutputType, isObjectType, isInterfaceType, isWrappingType } from 'graphql';
import { FieldsByTypeName, parse } from 'graphql-parse-resolve-info';
import { I18nService } from 'nestjs-i18n';
import { getContextObject } from '../utils/get-context-object.util';
import { AuthenticationError, ForbiddenError } from '../utils/errors.util';
import { AUTHORIZATION_ROLE_KEY, ALLOWANONYMOUS_KEY } from '../constants';

export enum UserRole {
  User = 'user',
  Administrator = 'administrator',
}

/**
 * 判断是否是登录状态和验证角色权限
 */
@Injectable()
export class AuthorizedGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly i18nService: I18nService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = getContextObject(context);
    if (!ctx) {
      throw Error(`context type: ${context.getType()} not supported`);
    }

    const type = context.getType<GqlContextType>();
    const user: JwtPayload | null = ctx.user;
    const lang: string | undefined = ctx.i18nLang;

    // graphql 判断返回实体字段是否有权限
    if (type === 'graphql') {
      const info = GqlExecutionContext.create(context).getInfo<GraphQLResolveInfo>();

      /**
       * 这里未使用 FieldMiddleware 原因在于中间件对每个 field 是隔离的，当其中 field 验证失败时，ResoloveField 会继续执行
       * https://docs.nestjs.com/graphql/extensions
       */
      // @FieldAuthorized
      const fieldRoles = this.resolveGraphqlOutputFieldsRoles(info);
      for (const field in fieldRoles) {
        if (!user || !this.hasRolePermission(user!, fieldRoles[field])) {
          // false return 403
          throw new ForbiddenError(
            await this.i18nService.tv(
              'error.forbidden_field',
              `Access denied, You don't capability for field "${field}"!`,
              {
                lang,
                args: { field, userRole: user?.role },
              },
            ),
          );
        }
      }
    }

    const anonymous = this.reflector.getAllAndOverride<boolean>(ALLOWANONYMOUS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // 如果匿名，则直接返回
    if (anonymous === true) {
      return true;
    }

    // method 覆写 class 权限
    const roles = this.reflector.getAllAndOverride<UserRole[]>(AUTHORIZATION_ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // no @Authorized
    if (!roles) {
      return true;
    }

    if (!user) {
      // 没有的提供 token, return 401
      throw new AuthenticationError(
        await this.i18nService.tv('error.unauthorized', `Access denied, You don't permission for this action!`, {
          lang,
        }),
      );
    } else if (!this.hasRolePermission(user, roles)) {
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
   * 判断用户角色是否在提供的角色内
   * @param user 用户
   * @param roles 角色，如果用户色值有值但提供的角色长度为0，会直接返回true
   */
  private hasRolePermission(user: JwtPayload, roles: UserRole[]): boolean {
    if (!roles.length) {
      return true; // 空 array 表示没有限制(如：@Authorized())
    } else {
      const userRoles = user.role ? (Array.isArray(user.role) ? user.role : [user.role]) : [];
      return Boolean(userRoles.length && roles.some((role) => userRoles.includes(role)));
    }
  }

  /**
   * 获取 Graphql Output fields 的角色权限
   * @param info GraphQLResolveInfo
   */
  private resolveGraphqlOutputFieldsRoles(info: GraphQLResolveInfo): { [field: string]: UserRole[] } {
    const parsedResolveInfoFragment = parse(info, { keepRoot: false, deep: true });

    if (!parsedResolveInfoFragment) {
      return {};
    }

    const rootFields = parsedResolveInfoFragment.fieldsByTypeName
      ? (parsedResolveInfoFragment.fieldsByTypeName as FieldsByTypeName)
      : (parsedResolveInfoFragment as FieldsByTypeName);

    return resolveFields(rootFields, info.returnType);

    function resolveFields(
      fieldsByTypeName: FieldsByTypeName,
      type: GraphQLOutputType,
      parentTypeName?: string,
      fieldRoles: { [field: string]: UserRole[] } = {},
    ) {
      const returnType = getUnWrappingType(type);

      // todo: isUnionType
      if (isObjectType(returnType) || isInterfaceType(returnType)) {
        for (const key in fieldsByTypeName[returnType.name]) {
          const fields = returnType.getFields();
          const field = fieldsByTypeName[returnType.name][key];
          if (fields[field.name]?.extensions?.roles) {
            fieldRoles[`${parentTypeName ? parentTypeName + '.' : ''}${field.name}`] = fields[field.name].extensions
              ?.roles as UserRole[];
          }
          Object.keys(field.fieldsByTypeName).length &&
            resolveFields(field.fieldsByTypeName, fields[field.name].type, field.name, fieldRoles);
        }
      }
      return fieldRoles;
    }

    function getUnWrappingType(type: GraphQLOutputType): any {
      if (isWrappingType(type)) {
        return getUnWrappingType(type.ofType);
      }
      return type;
    }
  }
}
