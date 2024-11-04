import { SetMetadata, UseGuards, UseFilters, applyDecorators } from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import { TokenGuard } from '../guards/token.guard';
import { UnauthorizedFilter } from '../filters/unauthorized.filter';
import { getArrayFromOverloadedRest } from '../utils/array-overload';
import { AUTHORIZATION_KEY, AUTHORIZATION_ROLE_KEY, ALLOWANONYMOUS_KEY } from '../oidc.constants';

/**
 * 角色权限验证（on Method or Class）
 * Warning：if roles parameter is not setted, it will bypasses role checking.
 * if roles parameter is setted, checking user's role is in settings,
 * if user is not authorized, return 401 error, if user's role is not in settings, return 403 error.
 * @param roles 角色权限
 */
export function Authorized(roles: string[]): ClassDecorator & MethodDecorator;
export function Authorized(...roles: string[]): ClassDecorator & MethodDecorator;
export function Authorized(...rolesOrRoleArray: Array<string | string[]>): MethodDecorator & ClassDecorator {
  return applyDecorators(
    SetMetadata(AUTHORIZATION_KEY, true), // 验证登录
    SetMetadata(AUTHORIZATION_ROLE_KEY, getArrayFromOverloadedRest(rolesOrRoleArray)), // 角色权限
    UseGuards(TokenGuard), // 使用 Guards
    UseFilters(UnauthorizedFilter), // 使用 Filters
  );
}

export function Anonymous(): ClassDecorator & MethodDecorator {
  return applyDecorators(
    SetMetadata(ALLOWANONYMOUS_KEY, true), // 匿名访问
    UseGuards(TokenGuard), // 使用 Guards
    UseFilters(UnauthorizedFilter), // 使用 Filters
  );
}

/**
 * graphql 角色权限验证（on Field）
 * Warning: this is not restricted by [Anonymous].
 * @param role 角色
 * @param others 更多角色
 */
export function FieldAuthorized(role: string, ...others: string[]): PropertyDecorator {
  const { Extensions } = loadPackage('@nestjs/graphql', 'FieldAuthorized', () => require('@nestjs/graphql'));
  const roles = [role].concat(others);
  return applyDecorators(
    Extensions({
      roles, // 角色
    }),
    UseGuards(TokenGuard), // 使用 Guards
    UseFilters(UnauthorizedFilter), // 使用 Filters
  );
}
