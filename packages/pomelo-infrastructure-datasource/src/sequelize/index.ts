import merge from 'lodash.merge';
import { Logger } from '@nestjs/common';
import { Sequelize, Options as SequelizeOptions, SyncOptions, ModelStatic, CreationAttributes } from 'sequelize';
import * as DataSources from './datasources';
import * as Entities from './entities';
import { default as Options } from './entities/options.entity';
import { default as TermTaxonomy } from './entities/term-taxonomy.entity';
import { default as TermTaxonomyMeta } from './entities/term-taxonomy-meta.entity';
import { default as Templates } from './entities/templates.entity';
import { default as TemplateMeta } from './entities/template-meta.entity';
import { default as Users } from './entities/users.entity';
import { default as UserMeta } from './entities/user-meta.entity';
import { TableInitFunc } from './interfaces/table-init-func.interface';
import { Models, TableAssociateFunc } from './interfaces/table-associate-func.interface';
import { DataInitArgs } from './interfaces/data-init-args.interface';

export interface DatabaseOptions extends SequelizeOptions {
  tablePrefix?: string;
}

export class DatabaseManager {
  private readonly logger = new Logger(DatabaseManager.name, { timestamp: true });
  private associated = false;
  private readonly options: DatabaseOptions;
  public readonly sequelize: Sequelize;

  constructor(options: DatabaseOptions);
  constructor(uri: string, options?: DatabaseOptions);
  constructor(uri: string | DatabaseOptions, options?: DatabaseOptions) {
    options = typeof uri === 'string' ? options : uri;
    this.options = merge(options || {}, {
      define: {
        freezeTableName: true,
        underscored: true,
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        charset: options?.define?.charset || 'utf8mb4',
        collate: options?.define?.collate || 'utf8mb4_unicode_520_ci',
      },
    });
    this.sequelize = typeof uri === 'string' ? new Sequelize(uri, this.options) : new Sequelize(this.options);
  }

  /**
   * 创建数据库表结构及关联关系
   * @author Hubert
   * @since 2022-05-01
   * @version 0.0.1
   * @returns 数据库模型
   */
  associate(): Models {
    const models: Partial<Models> = {};
    const associates: TableAssociateFunc[] = [];

    for (const key in Entities) {
      const {
        init,
        associate,
        default: model,
      } = (
        Entities as Record<
          string,
          {
            init?: TableInitFunc;
            associate?: TableAssociateFunc;
            default: ModelStatic<any>;
          }
        >
      )[key];
      init?.(this.sequelize, { prefix: this.options.tablePrefix || '' });
      associate && associates.push(associate);
      model && (models[model.name as keyof Models] = model);
    }

    // associate needs to be called after all models are initialized
    associates.forEach((associate) => associate(models as Models));

    this.associated = true;

    return models as Models;
  }

  /**
   * 初始化数据库
   * @author Hubert
   * @since 2022-05-01
   * @version 0.0.1
   * @param options 初始化参数
   * @returns true: 生成数据库成功；false: 跳过数据库生成(when 条件不满足) 否则抛出 Error
   */
  async sync(
    options?: SyncOptions & { when?: boolean | ((sequelize: Sequelize) => Promise<boolean>) },
  ): Promise<boolean> {
    try {
      await this.sequelize.authenticate();
    } catch (err: any) {
      this.logger.error(`Unable to connect to the database, Error: ${err.message}`);
      throw err;
    }

    // 初始化关联关系
    !this.associated && this.associate();

    try {
      // eslint-disable-next-line prefer-const
      let { when = true, ...syncOptions } = options || {};
      if (typeof when === 'function') {
        when = await when.call(null, this.sequelize);
      }
      if (when) {
        await this.sequelize.sync(syncOptions);
        return true;
      }
      return false;
    } catch (err: any) {
      this.logger.error(`Unable to sync to the database, Error: ${err.message}`);
      throw err;
    }
  }

  /**
   * 实始化数据（必须在DB初始化表结构后调用）
   * @author Hubert
   * @since 2022-05-01
   * @version 0.0.1
   * @access None
   * @param initArgs 初始化参数
   */
  async initDatas(initArgs: DataInitArgs): Promise<true> {
    const t = await this.sequelize.transaction();
    try {
      const optionsCreation: CreationAttributes<Options>[] =
        initArgs.options?.map((option) => ({
          ...option,
          optionName: option.nameWithTablePrefix
            ? `${this.options.tablePrefix || ''}${option.optionName}`
            : option.optionName,
        })) ?? [];

      // 创建用户
      let defaultUserId = 0;
      if (initArgs.users?.length) {
        const users = await Users.bulkCreate(
          initArgs.users.map(({ metas: _ignored0, ...user }) => user),
          { transaction: t },
        );

        defaultUserId = users[0].id;

        const userMetasCreation = initArgs.users.reduce((prev, item, index) => {
          return prev.concat(
            item.metas?.map((meta) => ({
              ...meta,
              metaKey: meta.keyWithTablePrefix ? `${this.options.tablePrefix || ''}${meta.metaKey}` : meta.metaKey,
              userId: users[index].id,
            })) || [],
          );
        }, [] as CreationAttributes<UserMeta>[]);

        userMetasCreation.length && (await UserMeta.bulkCreate(userMetasCreation, { transaction: t }));
      }

      // 创建分类
      if (initArgs.taxonomies?.length) {
        const taxonomies = await TermTaxonomy.bulkCreate(
          initArgs.taxonomies.map(({ metas: _ignored0, optionName: _ignored1, ...taxonomy }) => ({
            ...taxonomy,
            slug: taxonomy.slug || taxonomy.name,
          })),
          { transaction: t },
        );

        const termTaxonomyMetasCreation = initArgs.taxonomies.reduce((prev, item, index) => {
          return prev.concat(
            item.metas?.map((meta) => ({
              termTaxonomyId: taxonomies[index].id,
              ...meta,
            })) || [],
          );
        }, [] as CreationAttributes<TermTaxonomyMeta>[]);

        termTaxonomyMetasCreation.length &&
          (await TermTaxonomyMeta.bulkCreate(termTaxonomyMetasCreation, { transaction: t }));

        // 将 id 作为 optionValue 保存到 Options 表中
        initArgs.taxonomies.forEach((item, index) => {
          if (item.optionName) {
            optionsCreation.push({
              optionName: item.optionNameWithTablePrefix
                ? `${this.options.tablePrefix || ''}${item.optionName}`
                : item.optionName,
              optionValue: taxonomies[index].id.toString(),
            });
          }
        });
      }

      // 创建模板
      if (initArgs.templates?.length) {
        const templates = await Templates.bulkCreate(
          initArgs.templates.map(({ metas: _ignored0, optionName: _ignored1, ...template }) => ({
            ...template,
            author: defaultUserId,
          })),
          { transaction: t },
        );

        const templateMetasCreation = initArgs.templates.reduce((prev, item, index) => {
          return prev.concat(
            item.metas?.map((meta) => ({
              templateId: templates[index].id,
              ...meta,
            })) || [],
          );
        }, [] as CreationAttributes<TemplateMeta>[]);

        templateMetasCreation.length && (await TemplateMeta.bulkCreate(templateMetasCreation, { transaction: t }));

        // 将 id 作为 optionValue 保存到 Options 表中
        initArgs.templates.forEach((item, index) => {
          if (item.optionName) {
            optionsCreation.push({
              optionName: item.optionNameWithTablePrefix
                ? `${this.options.tablePrefix || ''}${item.optionName}`
                : item.optionName,
              optionValue: templates[index].id.toString(),
            });
          }
        });
      }

      // 创建选项
      optionsCreation.length && (await Options.bulkCreate(optionsCreation, { transaction: t }));

      await t.commit();
      return true;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
}

export const dataSources = Object.values(DataSources);
export * from './datasources';
export * from './helpers';
export * from './interfaces';
