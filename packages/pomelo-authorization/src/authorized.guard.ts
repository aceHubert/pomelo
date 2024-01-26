import { Reflector } from '@nestjs/core';
import {
  Inject,
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { getRequest, RequestUser } from '@ace-pomelo/shared-server';
import { GqlExecutionContext, GqlContextType } from '@nestjs/graphql';
import { isObjectType, isInterfaceType, isWrappingType, GraphQLResolveInfo, GraphQLOutputType } from 'graphql';
import { parse, FieldsByTypeName } from 'graphql-parse-resolve-info';
import { AuthorizationOptions } from './interfaces/authorization-options.interface';
import { AUTHORIZATION_OPTIONS, AUTHORIZATION_KEY, AUTHORIZATION_ROLE_KEY, ALLOWANONYMOUS_KEY } from './constants';

/**
 * 判断是否是登录状态和验证角色权限
 */
@Injectable()
export class AuthorizedGuard implements CanActivate {
  constructor(
    @Inject(AUTHORIZATION_OPTIONS) private readonly options: AuthorizationOptions,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = getRequest(context);
    if (!request) {
      throw Error(`context type: ${context.getType()} not supported`);
    }

    const type = context.getType<GqlContextType>();

    const anonymous = this.reflector.getAllAndOverride<boolean>(ALLOWANONYMOUS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // @Anonymous() decorator, return true
    if (anonymous === true) {
      return true;
    }

    const authorized = this.reflector.getAllAndOverride<boolean>(AUTHORIZATION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // no @Authorized() decorator, return true
    if (authorized !== true) {
      return true;
    }

    // method 覆写 class 权限
    const capabilities = this.reflector.getAllAndOverride<string[]>(AUTHORIZATION_ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const user = request[this.options.userProperty!] as RequestUser;
    if (!user) {
      // 没有的提供 token, return 401
      throw new UnauthorizedException(`Access denied, You don't have permission for this action!`);
    } else if (capabilities?.length && !this.hasRolePermission(user, capabilities)) {
      // false return 403
      throw new ForbiddenException(`Access denied, You don't have capability for this action!`);
    }

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
  resolveGraphqlOutputFieldsRoles(info: GraphQLResolveInfo): { [field: string]: string[] } {
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
      fieldRoles: { [field: string]: string[] } = {},
    ) {
      const returnType = getUnWrappingType(type);

      // todo: isUnionType
      if (isObjectType(returnType) || isInterfaceType(returnType)) {
        for (const key in fieldsByTypeName[returnType.name]) {
          const fields = returnType.getFields();
          const field = fieldsByTypeName[returnType.name][key];
          if (fields[field.name]?.extensions?.roles) {
            fieldRoles[`${parentTypeName ? parentTypeName + '.' : ''}${field.name}`] = fields[field.name].extensions
              ?.roles as string[];
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

  /**
   * 判断用户角色是否在提供的角色内
   * @param user 用户
   * @param roles 角色权限，如果用户色值有值但提供的角色长度为0，会直接返回true
   */
  hasRolePermission(user: RequestUser, roles: string[]): boolean {
    if (!roles.length) {
      // 空 array 表示没有限制(如：@Authorized())
      return true;
    } else {
      // @Authorized(['admin', 'editor'])
      const userRole = user.role as string | undefined;
      return Boolean(userRole && roles.some((role) => userRole === role));
    }
  }
}
