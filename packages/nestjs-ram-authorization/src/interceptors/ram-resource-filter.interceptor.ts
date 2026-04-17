import { Inject, Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { RAM_AUTHORIZATION_OPTIONS, RAM_AUTHORIZATION_ACTION_KEY, RAM_RESOURCE_FILTER_KEY } from '../constants';
import { RAMAuthorizationEvaluator } from '../core/RAMAuthorizationEvaluator';
import { RAMAuthorizeContext } from '../core/RAMAuthorizeContext';
import { RamAuthorizationOptions } from '../interfaces/ram-authorization-options.interface';
import { RamEvaluationResult } from '../interfaces/ram-evaluation-result.interface';
import { RamResourceFilterOptions } from '../interfaces/ram-resource-filter.interface';
import { CompositePolicyProvider } from '../providers/composite-policy.provider';
import { getContextObject } from '../utils/get-context-object';

/**
 * RAM 资源过滤拦截器
 * 根据用户的 RAM 策略自动过滤返回的资源数据
 */
@Injectable()
export class RamResourceFilterInterceptor implements NestInterceptor {
  constructor(
    @Inject(RAM_AUTHORIZATION_OPTIONS) private readonly options: RamAuthorizationOptions,
    private readonly reflector: Reflector,
    private readonly policyProvider: CompositePolicyProvider,
    private readonly evaluator: RAMAuthorizationEvaluator,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const filterOptions = this.reflector.get<RamResourceFilterOptions>(RAM_RESOURCE_FILTER_KEY, context.getHandler());

    if (!filterOptions) {
      return next.handle();
    }

    // 如果没有配置 responseFilter，直接返回原始数据
    if (!filterOptions.responseFilter) {
      return next.handle();
    }

    const ctx = getContextObject(context);
    const user = ctx?.[this.options.userProperty!] as Record<string, any> | undefined;

    if (!user) {
      return next.handle();
    }

    // 获取策略并评估资源级别权限
    const policies = await this.policyProvider.getAllPolicies(user, this.options.serviceName);

    if (policies.length === 0) {
      // 没有策略时，直接返回原始数据
      return next.handle();
    }

    const action = filterOptions.action || this.getActionFromMetadata(context);

    if (!action) {
      // 没有指定 action，跳过过滤
      return next.handle();
    }

    const authContext = new RAMAuthorizeContext(
      this.options.serviceName,
      action,
      policies,
      filterOptions.resourceType,
      undefined,
      this.options.resourcePrefix,
    );

    const result = this.evaluator.evaluateForResources(authContext, filterOptions.resourceType);

    // 创建 isResourceAllowed 辅助函数
    const isResourceAllowed = (resourceId: string | number | undefined) => this.isResourceAllowed(resourceId, result);

    return next.handle().pipe(map((data) => this.filterResponse(data, result, filterOptions, isResourceAllowed)));
  }

  /**
   * 从元数据获取 Action
   */
  private getActionFromMetadata(context: ExecutionContext): string | undefined {
    return this.reflector.getAllAndOverride<string>(RAM_AUTHORIZATION_ACTION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  }

  /**
   * 过滤响应数据
   * 只处理配置了 responseFilter 的情况，否则直接返回原始数据
   */
  private filterResponse(
    data: any,
    result: RamEvaluationResult,
    options: RamResourceFilterOptions,
    isResourceAllowed: (resourceId: string | number | undefined) => boolean,
  ): any {
    // 只有配置了自定义过滤器才进行过滤
    if (options.responseFilter) {
      return options.responseFilter(data, result, isResourceAllowed);
    }

    // 没有配置过滤器，直接返回原始数据
    return data;
  }

  /**
   * 检查资源是否被允许访问
   */
  private isResourceAllowed(resourceId: string | number | undefined, result: RamEvaluationResult): boolean {
    if (resourceId === undefined) {
      return true; // 没有 ID 的资源默认允许
    }

    const idStr = String(resourceId);

    // 检查是否在拒绝列表中
    if (result.deniedResourceIds.map(String).includes(idStr)) {
      return false;
    }

    // 如果有通配符允许，且不在拒绝列表中，则允许
    if (result.wildcardAllowed) {
      return true;
    }

    // 检查是否在允许列表中
    return result.allowedResourceIds.map(String).includes(idStr);
  }
}
