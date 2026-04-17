/**
 * RAM 资源上下文
 */
export interface RamResourceContext {
  /**
   * 资源类型（如 user, article, product 等）
   */
  resourceType: string;

  /**
   * 资源 ID（可选，用于单个资源的权限检查）
   */
  resourceId?: string | number;
}
