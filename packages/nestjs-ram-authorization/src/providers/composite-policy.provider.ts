import { Inject, Injectable, Optional } from '@nestjs/common';

import { RAMPolicy } from '../core/RAMPolicy';
import { RAM_POLICY_PROVIDERS } from '../constants';
import { IRamPolicyProvider } from './ram-policy-provider.interface';

/**
 * 组合策略提供者
 * 聚合多个策略提供者，按优先级排序后获取所有策略
 */
@Injectable()
export class CompositePolicyProvider {
  private readonly sortedProviders: IRamPolicyProvider[];

  constructor(
    @Optional()
    @Inject(RAM_POLICY_PROVIDERS)
    providers: IRamPolicyProvider[] = [],
  ) {
    // 按优先级排序（数字越小优先级越高）
    this.sortedProviders = [...providers].sort((a, b) => a.priority - b.priority);
  }

  /**
   * 获取所有策略提供者的策略
   *
   * @param user 用户对象
   * @param serviceName 服务名称
   * @returns 所有策略的合并列表
   */
  async getAllPolicies(user: Record<string, any>, serviceName: string): Promise<RAMPolicy[]> {
    const allPolicies: RAMPolicy[] = [];

    for (const provider of this.sortedProviders) {
      const policies = await provider.getPolicies(user, serviceName);
      allPolicies.push(...policies);
    }

    return allPolicies;
  }

  /**
   * 获取已注册的策略提供者数量
   */
  get providerCount(): number {
    return this.sortedProviders.length;
  }
}
