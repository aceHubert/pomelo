/**
 * RAM 资源评估结果
 */
export interface RamEvaluationResult {
  /**
   * 是否允许访问（至少有一个允许的资源）
   */
  allowed: boolean;

  /**
   * 允许访问的资源 ID 列表
   */
  allowedResourceIds: (string | number)[];

  /**
   * 拒绝访问的资源 ID 列表
   */
  deniedResourceIds: (string | number)[];

  /**
   * 是否有通配符允许（允许访问所有资源）
   */
  wildcardAllowed: boolean;

  /**
   * 是否有通配符拒绝（拒绝访问所有资源）
   */
  wildcardDenied: boolean;
}
