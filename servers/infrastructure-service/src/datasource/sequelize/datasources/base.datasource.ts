import { words, capitalize } from 'lodash';
import { ModelDefined, ModelStatic, ProjectionAlias, Dialect } from 'sequelize';
import { Logger } from '@nestjs/common';
import {
  ForbiddenError,
  jsonSafelyParse,
  OptionAutoload,
  OptionPresetKeys,
  UserMetaPresetKeys,
  UserCapability,
} from '@ace-pomelo/shared/server';
import { InfrastructureDatasourceService } from '../../datasource.service';
import { Options, UserMeta } from '../entities';

// https://github.com/microsoft/TypeScript/issues/47663
import type {} from 'sequelize/types/utils';

const __AUTOLOAD_OPTIONS__ = new Map<string, string>(); // Autoload options 缓存
const __OPTIONS__ = new Map<string, string>(); // Not autoload options 缓存

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
   * Autoload Options from option table
   * 优先返回带有tablePrefix的value
   */
  protected get autoloadOptions() {
    // 避免每次从缓存字符串序列化
    if (__AUTOLOAD_OPTIONS__.size > 0) {
      return Promise.resolve(Object.fromEntries(__AUTOLOAD_OPTIONS__));
    } else {
      return (async () => {
        // 赋默认值，initialize 会多次执行
        const options = await Options.findAll({
          attributes: ['optionName', 'optionValue'],
          where: {
            autoload: OptionAutoload.Yes,
          },
        }).then((options) =>
          // 优先取带有 tablePrefix 的值
          options.reduce((prev, curr, index, arr) => {
            let key = curr.optionName,
              value;

            if (curr.optionName.startsWith(this.tablePrefix)) {
              key = curr.optionName.substring(this.tablePrefix.length);
              value = curr.optionValue;
            } else if (
              !(value = arr.find(
                ({ optionName }) => optionName === `${this.tablePrefix}${curr.optionName}`,
              )?.optionValue)
            ) {
              value = curr.optionValue;
            }
            prev[key] = value;
            return prev;
          }, {} as Record<string, string>),
        );
        // 缓存
        Object.entries(options).forEach(([key, value]) => {
          __AUTOLOAD_OPTIONS__.set(key, value);
        });
        return options;
      })();
    }
  }

  /**
   * 修改 Options 时重置缓存，下次重新加载
   */
  protected resetOptions() {
    __AUTOLOAD_OPTIONS__.clear();
    __OPTIONS__.clear();
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
  protected async getOption<V extends string>(optionName: string): Promise<V | undefined> {
    // 从autoload options缓存中取值
    let value = (await this.autoloadOptions)[optionName] as V | undefined;
    // 从非autoload options缓存中取值
    if (value === void 0) {
      value = __OPTIONS__.get(optionName) as V | undefined;
    }
    // 如果缓存中没有，从数据库查询
    if (value === void 0) {
      const options = await Options.findAll({
        attributes: ['optionName', 'optionValue'],
        where: {
          optionName: [optionName, `${this.tablePrefix}${optionName}`],
          autoload: OptionAutoload.No,
        },
      });

      // 先找带有当前table前缀的参数
      value = options.find((option) => option.optionName === `${this.tablePrefix}${optionName}`)?.optionValue as
        | V
        | undefined;

      // 如果没有，找不带前缀的参数
      if (value === void 0) {
        value = options.find((option) => option.optionName === optionName)?.optionValue as V | undefined;
      }

      // 缓存
      value !== void 0 && __OPTIONS__.set(optionName, value);
    }
    return value;
  }
}
