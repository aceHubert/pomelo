import { Reflector } from '@nestjs/core';
import { Inject, CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import { Request } from 'express';
import { OidcService } from '../oidc.service';
import { OidcModuleOptions } from '../interfaces/oidc-module-options.interface';
import { AUTHORIZATION_KEY, AUTHORIZATION_ROLE_KEY, ALLOWANONYMOUS_KEY, OIDC_MODULE_OPTIONS } from '../oidc.constants';
import { hasDecorator } from '../utils/has-decorator';
import { getContextObject } from '../utils/get-context-object';
import { UnauthorizedError } from '../utils/errors';

@Injectable()
export class TokenGuard implements CanActivate {
  constructor(
    @Inject(OIDC_MODULE_OPTIONS) public options: OidcModuleOptions,
    private readonly reflector: Reflector,
    private oidcService: OidcService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const ctx = getContextObject<Request>(context);
    if (!ctx) {
      throw Error(`context type: ${context.getType()} not supported`);
    }

    const anonymous = hasDecorator(ALLOWANONYMOUS_KEY, context, this.reflector);

    // @Anonymous() decorator, return true
    if (anonymous) {
      return true;
    }

    const authorized = hasDecorator(AUTHORIZATION_KEY, context, this.reflector);

    // no @Authorized() decorator, return true
    if (!authorized) return true;

    const redirect = this.options.disableController !== true && ctx.headers['accept']?.includes('text/html');

    if (ctx.isAuthenticated()) {
      if (ctx.user.expired) {
        if (ctx.user.refresh_token) {
          const params = ctx.params;
          await this.oidcService
            .requestTokenRefresh(ctx.user.refresh_token, {
              tenantId: params.tenantId,
              channelType: params.channelType as any,
            })
            .then((data) => {
              this.oidcService.updateUserToken(data, ctx);
              data.refresh_expires_in && this.oidcService.updateSessionDuration(data.refresh_expires_in as number, ctx);
            })
            .catch((err) => {
              throw new UnauthorizedError(err, redirect);
            });
        } else {
          throw new UnauthorizedError(`Access denied, You don't have permission for this action!`, redirect);
        }
      }

      const roles = this.reflector.getAllAndOverride<string[] | undefined>(AUTHORIZATION_ROLE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

      if (roles?.length && !this.hasRolePermission(ctx.user, roles)) {
        // false return 403
        throw new ForbiddenException(`Access denied, You don't have capability for this action!`);
      }

      const type = context.getType<string>();

      // graphql 判断返回实体字段是否有权限
      if (type === 'graphql') {
        const { GqlExecutionContext } = loadPackage('@nestjs/graphql', 'TokenAuthorizationGuard', () =>
          require('@nestjs/graphql'),
        );
        const info = GqlExecutionContext.create(context).getInfo();

        /**
         * 这里未使用 FieldMiddleware 原因在于中间件对每个 field 是隔离的，当其中 field 验证失败时，ResoloveField 会继续执行
         * https://docs.nestjs.com/graphql/extensions
         */
        // @FieldAuthorized
        const fieldRoles = this.resolveGraphqlOutputFieldsRoles(info);
        for (const field in fieldRoles) {
          if (!this.hasRolePermission(ctx.user, fieldRoles[field])) {
            // false return 403
            throw new UnauthorizedError(`Access denied, You don't capability for field "${field}"!)`, redirect);
          }
        }
      }

      return true;
    } else {
      throw new UnauthorizedError(`Access denied, You don't have permission for this action!`, redirect);
    }
  }

  /**
   * 获取 Graphql Output fields 的角色权限
   * @param info GraphQLResolveInfo
   */
  protected resolveGraphqlOutputFieldsRoles(info: any): { [field: string]: string[] } {
    const { isObjectType, isInterfaceType, isWrappingType } = loadPackage(
      'graphql',
      'ResolveGraphqlOutputFieldsRoles',
      () => require('graphql'),
    );
    const { parse } = loadPackage('graphql-parse-resolve-info', 'ResolveGraphqlOutputFieldsRoles', () =>
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

    function getUnWrappingType(type: any): any {
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
  protected hasRolePermission(user: Express.User, roles: string[]): boolean {
    if (!roles.length) {
      return true; // 空 array 表示没有限制(如：@Authorized())
    } else {
      return (this.options.checkRolePremissionFactory ?? this.defaultCheckRolePremissionFactory)(user, roles);
    }
  }

  /**
   * 默认通过 user.role 判断角色权限
   * @param user 用户
   * @param roles 角色权限
   */
  private defaultCheckRolePremissionFactory(user: Express.User, roles: string[]): boolean {
    const userRole = 'role' in user ? (user['role'] as string) : undefined;
    return Boolean(userRole && roles.some((role) => userRole === role));
  }
}
