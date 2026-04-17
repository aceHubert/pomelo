import { RAMPolicy } from '../core/RAMPolicy';

/**
 * 策略来源类型
 */
export enum PolicySourceType {
  /**
   * 来自 JWT Claims
   */
  JwtClaims = 'jwt_claims',
  /**
   * 来自外部提供者（如数据库、远程服务等）
   */
  External = 'external',
}

/**
 * RAM 策略提供者接口
 */
export interface IRamPolicyProvider {
  /**
   * 获取用户的 RAM 策略
   *
   * @param user 用户对象
   * @param serviceName 服务名称
   * @returns RAM 策略列表
   */
  getPolicies(user: Record<string, any>, serviceName: string): Promise<RAMPolicy[]>;

  /**
   * 策略来源类型
   */
  readonly sourceType: PolicySourceType;

  /**
   * 优先级（数字越小优先级越高）
   */
  readonly priority: number;
}
