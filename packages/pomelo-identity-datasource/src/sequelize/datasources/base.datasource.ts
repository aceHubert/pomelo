import { ModelDefined, ModelStatic, ProjectionAlias, Dialect } from 'sequelize';
import { ModuleRef } from '@nestjs/core';
import { Logger, OnModuleInit } from '@nestjs/common';
import { IdentityService } from '../../identity.service';
import { IdentityOptions } from '../../interfaces/identity-options.interface';
import { IDENTITY_OPTIONS } from '../../constants';

export abstract class BaseDataSource implements OnModuleInit {
  protected readonly moduleRef?: ModuleRef;
  protected identityService?: IdentityService;
  protected identityOptions?: IdentityOptions;
  protected readonly logger!: Logger;

  constructor() {
    this.logger = new Logger(this.constructor.name, { timestamp: true });
  }

  onModuleInit() {
    !this.identityService && (this.identityService = this.moduleRef?.get(IdentityService, { strict: false }));
    !this.identityOptions &&
      (this.identityOptions = this.moduleRef?.get<IdentityOptions>(IDENTITY_OPTIONS, { strict: false }));
  }

  private ensureIdentityService() {
    if (!this.identityService) {
      this.logger.warn('Please inject IdentityService or ModuleRef in SubClass constructor');
      throw new Error('IdentityService not initialized');
    }
  }

  private ensureIdentityOptions() {
    if (!this.identityOptions) {
      this.logger.warn('Please inject IdentityOptions or ModuleRef in SubClass constructor');
      throw new Error('IdentityOptions not initialized');
    }
  }

  /**
   * Get dialect from identityOptions.connection
   * Inject IdentityOptions in SubClass constructor when use this property before onModuleInit
   * or inject ModuleRef in SubClass constructor when use this property after onModuleInit
   */
  protected get databaseDialect() {
    this.ensureIdentityOptions();

    return typeof this.identityOptions!.connection === 'string'
      ? (this.identityOptions!.connection.split(':')[0] as Dialect)
      : this.identityOptions!.connection.dialect ?? 'mysql';
  }

  /**
   * Shortcut for this.identityOptions.tablePrefix
   * Inject IdentityOptions in SubClass constructor when use this property before onModuleInit
   * or inject ModuleRef in SubClass constructor when use this property after onModuleInit
   */
  protected get tablePrefix() {
    this.ensureIdentityOptions();

    return this.identityOptions!.tablePrefix || '';
  }

  /**
   * Shortcut for this.identityOptions.translate
   * Inject IdentityOptions in SubClass constructor when use this property before onModuleInit
   * or inject ModuleRef in SubClass constructor when use this property after onModuleInit
   */
  protected get translate() {
    this.ensureIdentityOptions();

    return this.identityOptions!.translate || ((key: string, fallback: string) => fallback);
  }

  /**
   * Shortcut for this.identityService.sequelize
   * Inject IdentityService in SubClass constructor when use this property before onModuleInit
   * or inject ModuleRef in SubClass constructor when use this property after onModuleInit
   */
  protected get sequelize() {
    this.ensureIdentityService();

    return this.identityService!.sequelize;
  }

  /**
   * Shortcut for this.identityService.models
   * Inject IdentityService in SubClass constructor when use this property before onModuleInit
   * or inject ModuleRef in SubClass constructor when use this property after onModuleInit
   */
  protected get models() {
    this.ensureIdentityService();

    return this.identityService!.models;
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
}
