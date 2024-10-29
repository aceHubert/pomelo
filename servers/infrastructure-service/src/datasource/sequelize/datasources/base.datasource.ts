import { words, capitalize } from 'lodash';
import { ModelDefined, ModelStatic, ProjectionAlias, Dialect } from 'sequelize';
import { Logger } from '@nestjs/common';
import {
  ForbiddenError,
  jsonSafelyParse,
  OptionPresetKeys,
  UserMetaPresetKeys,
  UserCapability,
} from '@ace-pomelo/shared/server';
import { InfrastructureDatasourceService } from '../../datasource.service';
import { Options, UserMeta } from '../entities';

// https://github.com/microsoft/TypeScript/issues/47663
import type {} from 'sequelize/types/utils';

export abstract class BaseDataSource {
  protected readonly logger!: Logger;

  constructor(protected readonly datasourceService: InfrastructureDatasourceService) {
    this.logger = new Logger(this.constructor.name, { timestamp: true });
  }

  /**
   * Get dialect
   */
  protected get databaseDialect(): Dialect {
    return this.datasourceService.sequelize.getDialect() as Dialect;
  }

  /**
   * Get table prefix
   */
  protected get tablePrefix() {
    return this.datasourceService.tablePrefix;
  }

  /**
   * Translate function
   */
  protected get translate() {
    return this.datasourceService.translate;
  }

  /**
   * 过滤非数据库字段造成的异常
   * @param fields 字段名
   * @param rawAttributes ORM 实体对象属性
   */
  protected filterFields(fields: string[], model: ModelStatic<any>): (string | ProjectionAlias)[] {
    const columns = Object.keys(model.rawAttributes);
    return fields.filter((field) => columns.includes(field));
  }

  /**
   * 获取 Sequelize mapping 到数据库的字段名
   * @param fieldName 实体模型字段名
   * @param model 实体模型
   */
  protected field<TAttributes extends {}>(
    fieldName: keyof TAttributes | 'createdAt' | 'updatedAt',
    model: ModelDefined<TAttributes, any>,
  ) {
    const field = model.rawAttributes[fieldName as string];
    return field && field.field ? field.field : fieldName;
  }

  /**
   * Sequelize.col 增强方法
   * 默认不会 mapper 到数据库字段名，返回Sequelize.col('modelName.field')
   * @param fieldName 实体模型字段名
   * @param model 实体模型
   * @param modelName 实体模型映射名称（默认为model.name）
   */
  protected col<TAttributes extends {}>(
    fieldName: keyof TAttributes | 'createdAt' | 'updatedAt',
    model: ModelDefined<TAttributes, any>,
    modelName?: string,
  ) {
    return this.datasourceService.sequelize.col(`${modelName || model.name}.${String(this.field(fieldName, model))}`);
  }

  protected async getUserCapabilities(userId: number): Promise<UserCapability[]> {
    const userRoles = jsonSafelyParse<
      Record<
        string,
        {
          name: string;
          capabilities: UserCapability[];
        }
      >
    >((await this.getOption(OptionPresetKeys.UserRoles))!);
    const userCapabilities = await UserMeta.findOne({
      attributes: ['metaValue'],
      where: {
        userId,
        metaKey: `${this.tablePrefix}${UserMetaPresetKeys.Capabilities}`,
      },
    }).then((meta) => {
      return meta?.metaValue;
    });
    const userRoleCapabilities = userCapabilities ? userRoles?.[userCapabilities].capabilities : [];

    return userRoleCapabilities ?? [];
  }

  /**
   * 验证用户是否有功能操作权限
   * @param capability 验证的功能
   * @param requestUserId 请求的用户ID
   * @param callback 当为 function 时如果验证不过参数 error 将是 ForbiddenError，否则为null;
   */
  protected async hasCapability(capability: UserCapability, requestUserId: number): Promise<void>;
  protected async hasCapability(
    capability: UserCapability,
    requestUserId: number,
    callback: (error?: Error) => void,
  ): Promise<void>;
  protected async hasCapability(
    capability: UserCapability,
    requestUserId: number,
    callback?: (error?: Error) => void,
  ): Promise<void> {
    const userCapabilities = await this.getUserCapabilities(requestUserId);
    const result = userCapabilities.includes(capability);

    if (!result) {
      const requiredCapability = this.translate(
        `infrastructure-service.datasource.user_capability.${capability}`,
        words(capability, /[^_]+/g)
          .map((word) => capitalize(word))
          .join(' '),
      );
      const error = new ForbiddenError(
        this.translate(
          'infrastructure-service.datasource.error.forbidden_capability',
          `Access denied, You don't have capability "${requiredCapability}" for this action!`,
          { requiredCapability },
        ),
      );

      if (callback) {
        return callback(error);
      } else {
        return Promise.reject(error);
      }
    } else {
      callback?.();
    }
  }

  /**
   * 获取 option value (优先从缓存中取)
   * @param optionName optionName（优先返回带有tablePrefix的value）
   */
  protected async getOption<T extends string = string>(optionName: string): Promise<T | undefined> {
    // 从缓存中取值
    let value = await this.datasourceService.optionsCache.get<string>(optionName);
    // 如果缓存中没有，从数据库查询
    if (value === null) {
      const options = await Options.findAll({
        attributes: ['optionName', 'optionValue'],
        where: {
          optionName: [optionName, `${this.tablePrefix}${optionName}`],
        },
      });

      // 先找带有当前table前缀的参数
      value = options.find((option) => option.optionName === `${this.tablePrefix}${optionName}`)?.optionValue ?? null;

      // 如果没有，找不带前缀的参数
      if (value === null) {
        value = options.find((option) => option.optionName === optionName)?.optionValue ?? null;
      }

      // 缓存
      value !== null && this.datasourceService.optionsCache.set(optionName, value);
    }

    return value === null ? undefined : (value as T);
  }

  /**
   * 修改 Options 时重置缓存，下次重新加载
   */
  protected resetOptions() {
    this.datasourceService.optionsCache.clear();
  }
}
