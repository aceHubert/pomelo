import { Inject, Injectable } from '@nestjs/common';

import { RAM_AUTHORIZATION_OPTIONS } from '../constants';
import { RAMAuthorizationEvaluator } from '../core/RAMAuthorizationEvaluator';
import { RAMAuthorizeContext } from '../core/RAMAuthorizeContext';
import { RamAuthorizationOptions } from '../interfaces/ram-authorization-options.interface';
import { RamEvaluationResult } from '../interfaces/ram-evaluation-result.interface';
import { CompositePolicyProvider } from '../providers/composite-policy.provider';

/**
 * 资源查询条件
 */
export interface RamResourceQueryCondition {
  /**
   * 是否允许访问所有资源（通配符允许）
   */
  wildcardAllowed: boolean;

  /**
   * 是否拒绝访问所有资源（通配符拒绝）
   */
  wildcardDenied: boolean;

  /**
   * 允许访问的资源 ID 列表
   * 当 wildcardAllowed 为 true 时，此列表可能为空
   */
  allowedIds: (string | number)[];

  /**
   * 拒绝访问的资源 ID 列表
   * 当 wildcardAllowed 为 true 时，需要排除这些 ID
   */
  deniedIds: (string | number)[];

  /**
   * 是否有任何访问权限
   */
  hasAccess: boolean;
}

/**
 * Sequelize 查询条件
 */
export interface SequelizeWhereCondition {
  [key: string]: any;
}

/**
 * RAM 资源查询助手
 * 用于在查询层面（如 Service 层）进行资源过滤
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class UserService {
 *   constructor(
 *     private readonly ramQueryHelper: RamResourceQueryHelper,
 *   ) {}
 *
 *   async findPaged(user: any, query: PagedQuery) {
 *     const condition = await this.ramQueryHelper.getQueryCondition(
 *       user,
 *       'user.paged-list',
 *       'user',
 *     );
 *
 *     if (!condition.hasAccess) {
 *       return { rows: [], count: 0 };
 *     }
 *
 *     const where = this.ramQueryHelper.buildSequelizeWhere(condition, 'id');
 *
 *     return this.userModel.findAndCountAll({
 *       where: { ...query.where, ...where },
 *       limit: query.limit,
 *       offset: query.offset,
 *     });
 *   }
 * }
 * ```
 */
@Injectable()
export class RamResourceQueryHelper {
  constructor(
    @Inject(RAM_AUTHORIZATION_OPTIONS) private readonly options: RamAuthorizationOptions,
    private readonly policyProvider: CompositePolicyProvider,
    private readonly evaluator: RAMAuthorizationEvaluator,
  ) {}

  /**
   * 获取资源查询条件
   *
   * @param user 用户对象
   * @param action Action 名称
   * @param resourceType 资源类型
   * @returns 查询条件
   */
  async getQueryCondition(
    user: Record<string, any>,
    action: string,
    resourceType: string,
  ): Promise<RamResourceQueryCondition> {
    const policies = await this.policyProvider.getAllPolicies(user, this.options.serviceName);

    // 如果没有策略
    if (policies.length === 0) {
      return {
        wildcardAllowed: this.options.allowWhenNoPolicies ?? false,
        wildcardDenied: !this.options.allowWhenNoPolicies,
        allowedIds: [],
        deniedIds: [],
        hasAccess: this.options.allowWhenNoPolicies ?? false,
      };
    }

    const authContext = new RAMAuthorizeContext(
      this.options.serviceName,
      action,
      policies,
      resourceType,
      undefined,
      this.options.resourcePrefix,
    );

    const result = this.evaluator.evaluateForResources(authContext, resourceType);

    return this.convertToQueryCondition(result);
  }

  /**
   * 将评估结果转换为查询条件
   */
  private convertToQueryCondition(result: RamEvaluationResult): RamResourceQueryCondition {
    return {
      wildcardAllowed: result.wildcardAllowed,
      wildcardDenied: result.wildcardDenied,
      allowedIds: result.allowedResourceIds,
      deniedIds: result.deniedResourceIds,
      hasAccess: result.allowed,
    };
  }

  /**
   * 构建 Sequelize WHERE 条件
   *
   * @param condition 查询条件
   * @param idField ID 字段名（默认 'id'）
   * @returns Sequelize WHERE 条件对象
   *
   * @example
   * ```typescript
   * // 通配符允许，排除特定 ID
   * // { id: { [Op.notIn]: ['123', '456'] } }
   *
   * // 只允许特定 ID
   * // { id: { [Op.in]: ['123', '456'] } }
   *
   * // 无访问权限
   * // { id: null } // 永远不匹配
   * ```
   */
  buildSequelizeWhere(condition: RamResourceQueryCondition, idField = 'id'): SequelizeWhereCondition {
    // 无访问权限
    if (condition.wildcardDenied || !condition.hasAccess) {
      // 返回一个永远不匹配的条件
      return { [idField]: null };
    }

    // 通配符允许
    if (condition.wildcardAllowed) {
      // 如果有拒绝列表，排除这些 ID
      if (condition.deniedIds.length > 0) {
        // 需要使用 Sequelize Op.notIn
        // 返回格式让调用者可以使用 Op.notIn
        return {
          [idField]: {
            $notIn: condition.deniedIds,
          },
        };
      }
      // 允许所有
      return {};
    }

    // 只允许特定 ID
    if (condition.allowedIds.length > 0) {
      return {
        [idField]: {
          $in: condition.allowedIds,
        },
      };
    }

    // 没有允许的 ID
    return { [idField]: null };
  }

  /**
   * 构建原生 SQL WHERE 子句
   *
   * @param condition 查询条件
   * @param idField ID 字段名（默认 'id'）
   * @param paramPrefix 参数前缀（用于防止参数名冲突）
   * @returns SQL WHERE 子句和参数
   *
   * @example
   * ```typescript
   * const { sql, params } = helper.buildSqlWhere(condition, 'id', 'ram');
   * // sql: 'id IN (:ram_ids)'
   * // params: { ram_ids: ['123', '456'] }
   * ```
   */
  buildSqlWhere(
    condition: RamResourceQueryCondition,
    idField = 'id',
    paramPrefix = 'ram',
  ): { sql: string; params: Record<string, any> } {
    // 无访问权限
    if (condition.wildcardDenied || !condition.hasAccess) {
      return { sql: '1 = 0', params: {} };
    }

    // 通配符允许
    if (condition.wildcardAllowed) {
      if (condition.deniedIds.length > 0) {
        return {
          sql: `${idField} NOT IN (:${paramPrefix}_denied_ids)`,
          params: { [`${paramPrefix}_denied_ids`]: condition.deniedIds },
        };
      }
      return { sql: '1 = 1', params: {} };
    }

    // 只允许特定 ID
    if (condition.allowedIds.length > 0) {
      return {
        sql: `${idField} IN (:${paramPrefix}_allowed_ids)`,
        params: { [`${paramPrefix}_allowed_ids`]: condition.allowedIds },
      };
    }

    return { sql: '1 = 0', params: {} };
  }

  /**
   * 检查单个资源是否被允许访问
   *
   * @param condition 查询条件
   * @param resourceId 资源 ID
   * @returns 是否允许访问
   */
  isResourceAllowed(condition: RamResourceQueryCondition, resourceId: string | number): boolean {
    if (condition.wildcardDenied) {
      return false;
    }

    const idStr = String(resourceId);

    // 检查是否在拒绝列表中
    if (condition.deniedIds.map(String).includes(idStr)) {
      return false;
    }

    // 通配符允许
    if (condition.wildcardAllowed) {
      return true;
    }

    // 检查是否在允许列表中
    return condition.allowedIds.map(String).includes(idStr);
  }
}
