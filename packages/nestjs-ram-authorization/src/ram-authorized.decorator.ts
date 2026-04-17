import { SetMetadata, UseGuards, UseInterceptors, applyDecorators } from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util';

import { TokenGuard } from './token.guard';
import { RAM_AUTHORIZATION_ACTION_KEY, RAM_RESOURCE_FILTER_KEY } from './constants';
import { RamResourceFilterInterceptor } from './interceptors/ram-resource-filter.interceptor';
import { RamResponseFilter } from './interfaces/ram-resource-filter.interface';

/**
 * 从 action 中提取 resourceType
 * action 格式: <resourceType>.<operation>
 * 例如: user.paged-list -> user
 */
function extractResourceTypeFromAction(action: string): string | undefined {
  const dotIndex = action.indexOf('.');
  if (dotIndex > 0) {
    return action.substring(0, dotIndex);
  }
  return undefined;
}

/**
 * RAM 授权配置选项
 */
export interface RamAuthorizedOptions<T = any, R = any> {
  /**
   * Action 名称
   * 格式: <resourceType>.<operation>
   * 例如: user.paged-list, article.detail
   * resourceType 会自动从 action 中推断
   */
  action: string;

  /**
   * 资源类型（如 user, article, product 等）
   * 默认从 action 中自动推断，如需覆盖可显式指定
   */
  resourceType?: string;

  /**
   * 自定义响应过滤器
   * 用于过滤返回的数据
   */
  responseFilter?: RamResponseFilter<T, R>;
}

/**
 * 授权策略验证装饰器
 *
 * @example
 * ```typescript
 * // 简单用法 - 只检查 Action 权限，不启用资源过滤
 * @RamAuthorized('user.detail')
 * async getUser(@Param('id') id: number) {
 *   return this.userService.findById(id);
 * }
 *
 * // 对象配置 - 自动启用资源过滤，从 action 推断 resourceType
 * @RamAuthorized({ action: 'user.paged-list' })
 * async getPaged(@Query() query: PagedQuery) {
 *   return this.userService.findPaged(query);
 * }
 *
 * // 自定义过滤器
 * @RamAuthorized({
 *   action: 'user.dashboard',
 *   responseFilter: (data, result, isAllowed) => ({
 *     ...data,
 *     users: data.users.filter(u => isAllowed(u.id)),
 *   }),
 * })
 * async getDashboard() {
 *   return this.userService.getDashboard();
 * }
 *
 * // 显式指定 resourceType（覆盖自动推断）
 * @RamAuthorized({
 *   action: 'dashboard.user-stats',
 *   resourceType: 'user',  // 覆盖自动推断的 'dashboard'
 * })
 * async getUserStats() {
 *   return this.dashboardService.getUserStats();
 * }
 * ```
 */
export function RamAuthorized<T = any, R = any>(actionOrOptions: string | RamAuthorizedOptions<T, R>): MethodDecorator {
  // 处理简单字符串参数 - 只检查 Action 权限，不启用资源过滤
  if (typeof actionOrOptions === 'string') {
    return applyDecorators(SetMetadata(RAM_AUTHORIZATION_ACTION_KEY, actionOrOptions), UseGuards(TokenGuard));
  }

  // 处理对象配置 - 自动启用资源过滤
  const { action, resourceType: explicitResourceType, responseFilter } = actionOrOptions;

  // 优先使用显式指定的 resourceType，否则从 action 中推断
  const resourceType = explicitResourceType || extractResourceTypeFromAction(action);

  const decorators: (ClassDecorator | MethodDecorator | PropertyDecorator)[] = [
    SetMetadata(RAM_AUTHORIZATION_ACTION_KEY, action),
    UseGuards(TokenGuard),
  ];

  // 对象配置自动启用资源过滤
  if (resourceType) {
    decorators.push(
      SetMetadata(RAM_RESOURCE_FILTER_KEY, {
        resourceType,
        action,
        responseFilter,
      }),
      UseInterceptors(RamResourceFilterInterceptor),
    );
  }

  return applyDecorators(...decorators);
}

/**
 * graphql 授权策略验证 (Field)
 * Warning: this is not restricted by [Anonymous].
 * @param action Action
 */
export function FieldRamAuthorized(action: string): PropertyDecorator {
  const { Extensions } = loadPackage('@nestjs/graphql', 'FieldRamAuthorized', () => require('@nestjs/graphql'));
  return applyDecorators(
    Extensions({
      action, // 授权策略
    }),
    UseGuards(TokenGuard), // 使用  ram Guards
  );
}
