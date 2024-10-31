import { ModelDefined, ModelStatic, ProjectionAlias, Dialect } from 'sequelize';
import { Inject, Logger } from '@nestjs/common';
import { IdentityDatasourceService } from '../../datasource.service';

export abstract class BaseDataSource {
  protected readonly logger: Logger;

  @Inject()
  protected readonly datasourceService!: IdentityDatasourceService;

  constructor() {
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
}
