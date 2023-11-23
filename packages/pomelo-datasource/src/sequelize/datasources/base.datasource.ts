import { kebabCase, isEmpty } from 'lodash';
import { ModelDefined, ModelStatic, ProjectionAlias, Dialect } from 'sequelize';
import { ModuleRef } from '@nestjs/core';
import { Logger, OnModuleInit } from '@nestjs/common';
import { RequestUser, ForbiddenError, jsonSafelyParse } from '@ace-pomelo/shared-server';
import { OptionAutoload } from '../../entities/options.entity';
import { SequelizeService } from '../../sequelize/sequelize.service';
import { UserCapability, UserRole, UserRoles } from '../../utils/user-capability.util';
import { SequelizeOptions } from '../interfaces/sequelize-options.interface';
import { SEQUELIZE_OPTIONS } from '../constants';
import { OptionPresetKeys, UserMetaPresetKeys } from '../../utils/preset-keys.util';

export abstract class BaseDataSource implements OnModuleInit {
  private __AUTOLOAD_OPTIONS__: Record<string, string> = {}; // Autoload options 缓存
  private __OPTIONS__: Record<string, string> = {}; // Not autoload options 缓存
  private sequelizeOptions!: SequelizeOptions;
  protected readonly logger!: Logger;
  protected sequelizeService!: SequelizeService;

  constructor(protected readonly moduleRef: ModuleRef) {
    this.logger = new Logger(this.constructor.name, { timestamp: true });
  }

  async onModuleInit() {
    this.sequelizeService = this.moduleRef.get(SequelizeService, { strict: false });
    this.sequelizeOptions = this.moduleRef.get<SequelizeOptions>(SEQUELIZE_OPTIONS, { strict: false });
  }

  protected get databaseDialect() {
    return typeof this.sequelizeOptions.connection === 'string'
      ? (this.sequelizeOptions.connection.split(':')[0] as Dialect)
      : this.sequelizeOptions.connection.dialect ?? 'mysql';
  }

  protected get tablePrefix() {
    return this.sequelizeOptions.tablePrefix || '';
  }

  protected get translate() {
    return this.sequelizeOptions.translate || ((key: string, fallback: string) => fallback);
  }

  protected get sequelize() {
    return this.sequelizeService.sequelize;
  }

  protected get models() {
    return this.sequelizeService.models;
  }

  /**
   * Autoload Options from option table
   * 优先返回带有tablePrefix的value
   */
  protected get autoloadOptions() {
    // 避免每次从缓存字符串序列化
    if (!isEmpty(this.__AUTOLOAD_OPTIONS__)) {
      return Promise.resolve(this.__AUTOLOAD_OPTIONS__);
    } else {
      return (async () => {
        // 赋默认值，initialize 会多次执行
        const options: Record<string, string> = await this.models.Options.findAll({
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
        // 缓存到内存中
        this.__AUTOLOAD_OPTIONS__ = options;
        return options;
      })();
    }
  }

  /**
   * 修改 Options 时重置缓存，下次重新加载
   */
  protected resetOptions() {
    this.__AUTOLOAD_OPTIONS__ = {};
    this.__OPTIONS__ = {};
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
    const userRoles =
      jsonSafelyParse<UserRoles>((await this.getOption(OptionPresetKeys.UserRoles))!) ?? ({} as UserRoles);
    const userCapabilities = await this.models.UserMeta.findOne({
      attributes: ['metaValue'],
      where: {
        userId,
        metaKey: `${this.tablePrefix}${UserMetaPresetKeys.Capabilities}`,
      },
    }).then((meta) => {
      return meta?.metaValue as UserRole | undefined;
    });
    const userRoleCapabilities = userCapabilities ? userRoles[userCapabilities].capabilities : [];

    return userRoleCapabilities;
  }

  /**
   * 验证用户是否有功能操作权限
   * @param capability 验证的功能
   * @param requestUser 请求的用户
   * @param callbackOrThrow 当为 function 时如果验证不过参数 error 将是 ForbiddenError，否则为null; 为 ture 时，验证不过则抛出异常
   */
  protected async hasCapability(capability: UserCapability, requestUser: RequestUser): Promise<boolean>;
  protected async hasCapability(
    capability: UserCapability,
    requestUser: RequestUser,
    callbackOrThrow: true | ((error: Error | null) => void),
  ): Promise<void>;
  protected async hasCapability(
    capability: UserCapability,
    requestUser: RequestUser,
    callbackOrThrow?: true | ((error: Error | null) => void),
  ): Promise<boolean | void> {
    const userRoleCapabilities = await this.getUserCapabilities(Number(requestUser.sub));
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
              await this.translate(
                'datasource.error.forbidden_capability',
                `Access denied, You don't have capability "${kebabCase(capability)}" for this action!`,
                {
                  lang: requestUser.lang,
                  args: { requiredCapability: kebabCase(capability) },
                },
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
  async getOption<R extends string>(optionName: string): Promise<R | undefined> {
    // 从autoload options缓存中取值
    let value = (await this.autoloadOptions)[optionName] as R | undefined;
    // 从非autoload options缓存中取值
    if (value === void 0) {
      value = this.__OPTIONS__[optionName] as R | undefined;
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
        | R
        | undefined;

      // 如果没有，找不带前缀的参数
      if (value === void 0) {
        value = options.find((option) => option.optionName === optionName)?.optionValue as R | undefined;
      }

      // 缓存
      value !== void 0 && (this.__OPTIONS__[optionName] = value);
    }
    return value;
  }
}
