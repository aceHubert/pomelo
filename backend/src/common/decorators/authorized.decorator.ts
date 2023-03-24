import { SetMetadata, applyDecorators, CustomDecorator } from '@nestjs/common';
import { Extensions } from '@nestjs/graphql';
import { getArrayFromOverloadedRest } from '../utils/array-overload.util';
import { UserRole } from '../guards/authorized.guard';
import { AUTHORIZATION_KEY, AUTHORIZATION_ROLE_KEY, ALLOWANONYMOUS_KEY } from '../constants';

export { UserRole };

/**
 * 角色权限验证（on Method or Class）
 * Warning：if roles parameter is not setted, it will bypasses role checking.
 * if roles parameter is setted, checking user's role is in settings,
 * if user is not authorized, return 401 error, if user's role is not in settings, return 403 error.
 * @param roles 角色
 */
export function Authorized(roles: UserRole[]): ClassDecorator & MethodDecorator;
export function Authorized(...roles: UserRole[]): ClassDecorator & MethodDecorator;
export function Authorized(...rolesOrRoleArray: Array<UserRole | UserRole[]>): MethodDecorator & ClassDecorator {
  const roles = getArrayFromOverloadedRest(rolesOrRoleArray);
  return applyDecorators(
    SetMetadata(AUTHORIZATION_KEY, true), // 验证登录
    SetMetadata(AUTHORIZATION_ROLE_KEY, roles), // 角色权限
  );
}

/**
 * 匿名访问 (on Method or Class）
 * Warning: [Anonymous] bypasses all authorization statements.
 * If you combine [Anonymous] and any [Authorize] attribute, the [Authorize] attributes are ignored.
 * For example if you apply [Anonymous] at the controller level,
 * any [Authorize] attributes on the same controller (or on any action within it) is ignored (except graphql field).
 */
export function Anonymous(): CustomDecorator {
  return SetMetadata(ALLOWANONYMOUS_KEY, true);
}

/**
 * graphql 角色权限验证（on Field）
 * Warning: this is not restricted by [Anonymous].
 *
 * @param role 角色
 * @param others 更多角色
 */
export function FieldAuthorized(role: UserRole, ...others: UserRole[]): PropertyDecorator {
  const roles = [role].concat(others);
  return Extensions({
    roles, // 角色
  });
}
