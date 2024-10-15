import { Injectable, Inject, Logger, OnApplicationShutdown } from '@nestjs/common';
import { SyncOptions, CreationAttributes } from 'sequelize';
import { InfrastructureDatasourceOptions } from './interfaces/infrastructure-datasource-options.interface';
import { DataInitArgs } from './interfaces/data-init-args.interface';
import { Sequelize, SequelizeOptions } from './sequelize/sequelize';
import {
  Comments,
  CommentMeta,
  Links,
  Medias,
  MediaMeta,
  Options,
  Templates,
  TemplateMeta,
  TermTaxonomy,
  TermTaxonomyMeta,
  TermRelationships,
  Users,
  UserMeta,
} from './sequelize/entities';
import { INFRASTRUCTURE_DATASOURCE_OPTIONS } from './constants';

@Injectable()
export class InfrastructureDatasourceService implements OnApplicationShutdown {
  private readonly logger = new Logger(Sequelize.name, { timestamp: true });
  readonly sequelize: Readonly<Sequelize>;

  constructor(@Inject(INFRASTRUCTURE_DATASOURCE_OPTIONS) private readonly options: InfrastructureDatasourceOptions) {
    const sequelizeOptions: SequelizeOptions = {
      models: [
        Comments,
        CommentMeta,
        Links,
        Medias,
        MediaMeta,
        Options,
        Templates,
        TemplateMeta,
        TermTaxonomy,
        TermTaxonomyMeta,
        TermRelationships,
        Users,
        UserMeta,
      ],
      tablePrefix: options.tablePrefix,
      define: {
        freezeTableName: true,
        underscored: true,
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_520_ci',
      },
    };
    this.sequelize =
      typeof options.connection === 'string'
        ? new Sequelize(options.connection, sequelizeOptions)
        : new Sequelize({
            ...sequelizeOptions,
            ...options.connection,
            define: {
              ...sequelizeOptions.define,
              ...options.connection.define,
            },
          });
  }

  get tablePrefix() {
    return this.options.tablePrefix || '';
  }

  get translate() {
    return this.options.translate || ((key, fallback) => fallback);
  }

  /**
   * 初始化数据库
   * @author Hubert
   * @since 2022-05-01
   * @version 0.0.1
   * @param options 初始化参数
   * @returns true: 生成数据库成功；false: 跳过数据库生成(when 条件不满足) 否则抛出 Error
   */
  async syncDB(
    options?: SyncOptions & { when?: boolean | ((sequelize: Readonly<Sequelize>) => Promise<boolean>) },
  ): Promise<boolean> {
    try {
      await this.sequelize.authenticate();
    } catch (err: any) {
      this.logger.error(`Unable to connect to the database, Error: ${err.message}`);
      throw err;
    }

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
   * @param initArgs 初始化参数
   */
  async initDatas(initArgs: DataInitArgs): Promise<true> {
    const t = await this.sequelize.transaction();
    try {
      const optionsCreation: CreationAttributes<Options>[] =
        initArgs.options?.map((option) => ({
          ...option,
          optionName: option.nameWithTablePrefix ? `${this.tablePrefix}${option.optionName}` : option.optionName,
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
              metaKey: meta.keyWithTablePrefix ? `${this.tablePrefix}${meta.metaKey}` : meta.metaKey,
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
              optionName: item.optionNameWithTablePrefix ? `${this.tablePrefix}${item.optionName}` : item.optionName,
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
              optionName: item.optionNameWithTablePrefix ? `${this.tablePrefix}${item.optionName}` : item.optionName,
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

  onApplicationShutdown() {
    // close db connection
    this.sequelize?.close();
  }
}
