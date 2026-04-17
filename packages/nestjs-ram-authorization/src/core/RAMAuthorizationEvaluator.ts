import { Injectable } from '@nestjs/common';

import { RamEvaluationResult } from '../interfaces/ram-evaluation-result.interface';
import { matchAnyAction } from '../utils/action-matcher';
import { matchAnyResource, extractResourceIds } from '../utils/resource-matcher';
import { AuthorizeEffect } from './AuthorizeEffect';
import { IRAMAuthorizationEvaluator } from './IRAMAuthorizationEvaluator';
import { RAMAuthorizeContext } from './RAMAuthorizeContext';
import { RAMStatement } from './RAMStatement';

/**
 * RAM 授权评估器
 * 实现 Deny 优先的策略评估逻辑
 */
@Injectable()
export class RAMAuthorizationEvaluator implements IRAMAuthorizationEvaluator {
  /**
   * 评估授权 - Deny 优先
   * 1. 如果任何语句显式 Deny -> 拒绝
   * 2. 如果任何语句显式 Allow -> 允许
   * 3. 默认 -> 拒绝 (隐式拒绝)
   *
   * @param context 授权上下文
   * @returns 是否允许访问
   */
  async evaluateAsync(context: RAMAuthorizeContext): Promise<boolean> {
    const { Policies, fullActionName, resourceUrn, ResourcePrefix } = context;

    // 第一轮：检查是否有显式 Deny
    for (const policy of Policies) {
      for (const statement of policy.Statements || []) {
        if (statement.Effect !== AuthorizeEffect.Deny) continue;
        if (!this.actionMatches(statement, fullActionName)) continue;
        if (resourceUrn && !this.resourceMatches(statement, resourceUrn, ResourcePrefix)) continue;

        // 找到显式 Deny
        return false;
      }
    }

    // 第二轮：检查是否有显式 Allow
    for (const policy of Policies) {
      for (const statement of policy.Statements || []) {
        if (statement.Effect !== AuthorizeEffect.Allow) continue;
        if (!this.actionMatches(statement, fullActionName)) continue;
        if (resourceUrn && !this.resourceMatches(statement, resourceUrn, ResourcePrefix)) continue;

        // 找到显式 Allow
        return true;
      }
    }

    // 隐式拒绝
    return false;
  }

  /**
   * 评估资源级别访问，返回允许/拒绝的资源 ID 列表
   *
   * @param context 授权上下文
   * @param resourceType 资源类型
   * @returns 评估结果
   */
  evaluateForResources(context: RAMAuthorizeContext, resourceType: string): RamEvaluationResult {
    const { Policies, fullActionName, ServiceName, ResourcePrefix } = context;

    const result: RamEvaluationResult = {
      allowed: false,
      allowedResourceIds: [],
      deniedResourceIds: [],
      wildcardAllowed: false,
      wildcardDenied: false,
    };

    // 收集所有 Deny 语句的资源
    for (const policy of Policies) {
      for (const statement of policy.Statements || []) {
        if (statement.Effect !== AuthorizeEffect.Deny) continue;
        if (!this.actionMatches(statement, fullActionName)) continue;

        const { ids, hasWildcard } = extractResourceIds(statement.Resource, ServiceName, resourceType, ResourcePrefix);

        if (hasWildcard) {
          result.wildcardDenied = true;
        }
        result.deniedResourceIds.push(...ids);
      }
    }

    // 如果有通配符拒绝，直接返回
    if (result.wildcardDenied) {
      return result;
    }

    // 收集所有 Allow 语句的资源
    for (const policy of Policies) {
      for (const statement of policy.Statements || []) {
        if (statement.Effect !== AuthorizeEffect.Allow) continue;
        if (!this.actionMatches(statement, fullActionName)) continue;

        const { ids, hasWildcard } = extractResourceIds(statement.Resource, ServiceName, resourceType, ResourcePrefix);

        if (hasWildcard) {
          result.wildcardAllowed = true;
        }
        result.allowedResourceIds.push(...ids);
      }
    }

    // 从允许列表中移除被拒绝的资源
    if (result.deniedResourceIds.length > 0) {
      const deniedSet = new Set(result.deniedResourceIds.map(String));
      result.allowedResourceIds = result.allowedResourceIds.filter((id) => !deniedSet.has(String(id)));
    }

    // 去重
    result.allowedResourceIds = [...new Set(result.allowedResourceIds.map(String))];
    result.deniedResourceIds = [...new Set(result.deniedResourceIds.map(String))];

    // 设置 allowed 标志
    result.allowed = result.wildcardAllowed || result.allowedResourceIds.length > 0;

    return result;
  }

  /**
   * 检查 Action 是否匹配语句
   */
  private actionMatches(statement: RAMStatement, action: string): boolean {
    if (!statement.Action || statement.Action.length === 0) {
      return true; // 没有指定 Action 表示匹配所有
    }
    return matchAnyAction(statement.Action, action);
  }

  /**
   * 检查 Resource 是否匹配语句
   */
  private resourceMatches(statement: RAMStatement, resource: string, prefix: string): boolean {
    return matchAnyResource(statement.Resource, resource, prefix);
  }
}
