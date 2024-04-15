import { kebabCase } from 'lodash';
import { ModelDefined, ModelStatic, ProjectionAlias, Dialect } from 'sequelize';
import { ModuleRef } from '@nestjs/core';
import { Logger, OnModuleInit } from '@nestjs/common';
import { ForbiddenError, jsonSafelyParse } from '@ace-pomelo/shared-server';
import { InfrastructureService } from '../../infrastructure.service';
import { InfrastructureOptions } from '../../interfaces/infrastructure-options.interface';
import { INFRASTRUCTURE_OPTIONS } from '../../constants';
import { OptionPresetKeys } from '../helpers/option-preset-keys';
import { UserMetaPresetKeys } from '../helpers/user-preset-keys';
import { UserCapability } from '../helpers/user-capability';
import { OptionAutoload } from '../interfaces/option.interface';

const __AUTOLOAD_OPTIONS__ = new Map<string, string>(); // Autoload options 缓存
const __OPTIONS__ = new Map<string, string>(); // Not autoload options 缓存

export abstract class BaseDataSource implements OnModuleInit {
  protected readonly logger!: Logger;
  protected readonly moduleRef?: ModuleRef;
  protected infrastructureService?: InfrastructureService;
  protected infrastuctureOptions?: InfrastructureOptions;

  constructor() {
    this.logger = new Logger(this.constructor.name, { timestamp: true });
  }

  async onModuleInit() {
    !this.infrastructureService &&
      (this.infrastructureService = this.moduleRef?.get(InfrastructureService, { strict: false }));
    !this.infrastuctureOptions &&
      (this.infrastuctureOptions = this.moduleRef?.get<InfrastructureOptions>(INFRASTRUCTURE_OPTIONS, {
        strict: false,
      }));
  }

  private ensureInfrastuctureService() {
    if (!this.infrastructureService) {
      this.logger.warn('Please inject IdentityService or ModuleRef in SubClass constructor');
      throw new Error('IdentityService not initialized');
    }
  }

  private ensureInfrastuctureOptions() {
    if (!this.infrastuctureOptions) {
      this.logger.warn('Please inject IdentityOptions or ModuleRef in SubClass constructor');
      throw new Error('IdentityOptions not initialized');
    }
  }

  /**
   * Get dialect from infrastuctureOptions.connection
   * Inject IdentityOptions in SubClass constructor when use this property before onModuleInit
   * or inject ModuleRef in SubClass constructor when use this property after onModuleInit
   */
  protected get databaseDialect() {
    this.ensureInfrastuctureOptions();

    return typeof this.infrastuctureOptions!.connection === 'string'
      ? (this.infrastuctureOptions!.connection.split(':')[0] as Dialect)
      : this.infrastuctureOptions!.connection.dialect ?? 'mysql';
  }

  /**
   * Shortcut for this.infrastuctureOptions.tablePrefix
   * Inject IdentityOptions in SubClass constructor when use this property before onModuleInit
   * or inject ModuleRef in SubClass constructor when use this property after onModuleInit
   */
  protected get tablePrefix() {
    this.ensureInfrastuctureOptions();

    return this.infrastuctureOptions!.tablePrefix || '';
  }

  /**
   * Shortcut for this.infrastuctureOptions.translate
   * Inject IdentityOptions in SubClass constructor when use this property before onModuleInit
   * or inject ModuleRef in SubClass constructor when use this property after onModuleInit
   */
  protected get translate() {
    this.ensureInfrastuctureOptions();

    return this.infrastuctureOptions!.translate || ((key: string, fallback: string) => fallback);
  }

  /**
   * Shortcut for this.infrastructureService.sequelize
   * Inject IdentityService in SubClass constructor when use this property before onModuleInit
   * or inject ModuleRef in SubClass constructor when use this property after onModuleInit
   */
  protected get sequelize() {
    this.ensureInfrastuctureService();

    return this.infrastructureService!.sequelize;
  }

  /**
   * Shortcut for this.infrastructureService.models
   * Inject IdentityService in SubClass constructor when use this property before onModuleInit
   * or inject ModuleRef in SubClass constructor when use this property after onModuleInit
   */
  protected get models() {
    this.ensureInfrastuctureService();

    return this.infrastructureService!.models;
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
        const options = await this.models.Options.findAll({
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
    return this.sequelize.col(`${modelName || model.name}.${String(this.field(fieldName, model))}`);
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
    const userCapabilities = await this.models.UserMeta.findOne({
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
   * @param callbackOrThrow 当为 function 时如果验证不过参数 error 将是 ForbiddenError，否则为null; 为 ture 时，验证不过则抛出异常
   */
  protected async hasCapability(capability: UserCapability, requestUserId: number): Promise<boolean>;
  protected async hasCapability(
    capability: UserCapability,
    requestUserId: number,
    callbackOrThrow: true | ((error: Error | null) => void),
  ): Promise<void>;
  protected async hasCapability(
    capability: UserCapability,
    requestUserId: number,
    callbackOrThrow?: true | ((error: Error | null) => void),
  ): Promise<boolean | void> {
    const userRoleCapabilities = await this.getUserCapabilities(requestUserId);
    const result = userRoleCapabilities.some((userCapability) => userCapability === capability);

    if (callbackOrThrow) {
      const callback =
        typeof callbackOrThrow === 'function'
          ? callbackOrThrow
          : (error: Error | null) => {
              if (error) throw error;
            };

      return callback(
        !result
          ? new ForbiddenError(
              this.translate(
                'datasource.error.forbidden_capability',
                `Access denied, You don't have capability "${kebabCase(capability)}" for this action!`,
                { requiredCapability: kebabCase(capability) },
              ),
            )
          : null,
      );
    } else {
      return result;
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
      const options = await this.models.Options.findAll({
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
