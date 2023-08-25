import { ModuleRef } from '@nestjs/core';
import { Injectable } from '@nestjs/common';
import { Sequelize, SyncOptions } from 'sequelize';
import { Taxonomy } from '../../entities';
import { OptionPresetKeys } from '../utils/preset-keys.util';
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
    if (this.databaseDialect === 'mysql') {
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
      this.logger.warn(`${this.databaseDialect} is not supported!`);
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
      const defautlCategoryName = await this.translate('datasource.default_data.uncategorized', 'Uncategorized', {
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
          { optionName: OptionPresetKeys.SiteUrl, optionValue: initArgs.siteUrl },
          { optionName: OptionPresetKeys.Home, optionValue: initArgs.homeUrl },
          { optionName: OptionPresetKeys.DefaultCategory, optionValue: String(defaultCategoryTaxonomy.id) },
          { optionName: OptionPresetKeys.ThumbnailSizeWidth, optionValue: '150' },
          { optionName: OptionPresetKeys.ThumbnailSizeHeight, optionValue: '150' },
          { optionName: OptionPresetKeys.ThumbnailCrop, optionValue: '1' },
          { optionName: OptionPresetKeys.MediumSizeWidth, optionValue: '300' },
          { optionName: OptionPresetKeys.MediumSizeHeight, optionValue: '300' },
          { optionName: OptionPresetKeys.MediumLargeSizeWidth, optionValue: '768' },
          { optionName: OptionPresetKeys.MediumLargeSizeHeight, optionValue: '0' },
          { optionName: OptionPresetKeys.LargeSizeWidth, optionValue: '1200' },
          { optionName: OptionPresetKeys.LargeSizeHeight, optionValue: '1200' },
          { optionName: OptionPresetKeys.ActivePlugins, optionValue: '{}' },
          // 带数据库前缀属性
          { optionName: `${this.tablePrefix}${OptionPresetKeys.Locale}`, optionValue: initArgs.locale },
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
