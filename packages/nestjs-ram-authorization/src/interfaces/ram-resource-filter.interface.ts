import { RamEvaluationResult } from './ram-evaluation-result.interface';

/**
 * 自定义响应过滤器函数类型
 * @param data 原始响应数据
 * @param result RAM 评估结果
 * @param isResourceAllowed 检查资源是否被允许的辅助函数
 * @returns 过滤后的数据
 */
export type RamResponseFilter<T = any, R = any> = (
  data: T,
  result: RamEvaluationResult,
  isResourceAllowed: (resourceId: string | number | undefined) => boolean,
) => R;

/**
 * RAM 资源过滤选项
 */
export interface RamResourceFilterOptions<T = any, R = any> {
  /**
   * 资源类型（如 user, article, product 等）
   */
  resourceType: string;

  /**
   * Action 名称（由 @RamAuthorized 装饰器自动设置）
   */
  action?: string;

  /**
   * 自定义响应过滤器（必填）
   * 用于过滤返回的数据
   *
   * @example
   * ```typescript
   * @RamAuthorized({
   *   action: 'user.paged-list',
   *   responseFilter: (data, result, isAllowed) => ({
   *     ...data,
   *     items: data.items.filter(item => isAllowed(item.userId)),
   *   }),
   * })
   * ```
   */
  responseFilter?: RamResponseFilter<T, R>;
}
