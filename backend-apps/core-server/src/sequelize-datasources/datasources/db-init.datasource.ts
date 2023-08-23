import { ModuleRef } from '@nestjs/core';
import { Injectable } from '@nestjs/common';
import { Sequelize, SyncOptions } from 'sequelize';
import { Taxonomy } from '@/orm-entities/interfaces';
import { OptionKeys } from '../utils/keys.util';
import { InitArgs } from '../interfaces/init-args.interface';
import { BaseDataSource } from './base.datasource';

@Injectable()
export class DbInitDataSource extends BaseDataSource {
  constructor(protected readonly moduleRef: ModuleRef) {
    super(moduleRef);
  }

  /**
   * 初始化数据库表结构
   * @author Hubert
   * @since 2022-05-01
   * @version 0.0.1
   * @access None
   * @param options 初始化参数
   * @returns true: 生成数据库成功；false: 跳过数据库生成(when 条件不满足) 否则抛出 Error
   */
  async initDB(
    options?: SyncOptions & { when?: boolean | ((sequelize: Sequelize) => Promise<boolean>) },
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
   * 检查是否在在表，用于初始化表结构
   * @author Hubert
   * @since 2022-05-01
   * @version 0.0.1
   * @access None
   */
  haveTables(): Promise<boolean> {
    const dialect = this.getConfig<string>('database.dialect', 'mysql');
    if (dialect === 'mysql') {
      return this.sequelize
        .query(
          'select count(1) as tableCount from `INFORMATION_SCHEMA`.`TABLES` where `TABLE_SCHEMA`= (select database())',
        )
        .then(([value]) => {
          // 当没有表的时候初始化
          return (value as any)[0].tableCount > 0;
        });
    } else {
      // todo: 其它数据库
      this.logger.warn(`${dialect} is not supported!`);
      return Promise.resolve(true);
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
  async initDatas(initArgs: InitArgs): Promise<true> {
    const t = await this.sequelize.transaction();
    try {
      // 初始化默认分类
      const defautlCategoryName = await this.i18nService.tv('datasource.default_data.uncategorized', 'Uncategorized', {
        lang: initArgs.locale,
      });

      const defaultCategoryTaxonomy = await this.models.TermTaxonomy.create(
        { name: defautlCategoryName, slug: 'uncategorized', taxonomy: Taxonomy.Category, description: '' },
        {
          transaction: t,
        },
      );

      // 初始化配置参数
      await this.models.Options.bulkCreate(
        [
          { optionName: OptionKeys.SiteUrl, optionValue: initArgs.siteUrl },
          { optionName: OptionKeys.Home, optionValue: initArgs.homeUrl },
          { optionName: OptionKeys.DefaultCategory, optionValue: String(defaultCategoryTaxonomy.id) },
          { optionName: OptionKeys.ThumbnailSizeWidth, optionValue: '150' },
          { optionName: OptionKeys.ThumbnailSizeHeight, optionValue: '150' },
          { optionName: OptionKeys.ThumbnailCrop, optionValue: '1' },
          { optionName: OptionKeys.MediumSizeWidth, optionValue: '300' },
          { optionName: OptionKeys.MediumSizeHeight, optionValue: '300' },
          { optionName: OptionKeys.MediumLargeSizeWidth, optionValue: '768' },
          { optionName: OptionKeys.MediumLargeSizeHeight, optionValue: '0' },
          { optionName: OptionKeys.LargeSizeWidth, optionValue: '1200' },
          { optionName: OptionKeys.LargeSizeHeight, optionValue: '1200' },
          { optionName: OptionKeys.ActivePlugins, optionValue: '{}' },
          // 带数据库前缀属性
          { optionName: `${this.tablePrefix}${OptionKeys.Locale}`, optionValue: initArgs.locale },
        ],
        {
          transaction: t,
        },
      );

      await t.commit();
      return true;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
}
