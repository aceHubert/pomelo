import md5 from 'md5';
import { ModuleRef } from '@nestjs/core';
import { Injectable } from '@nestjs/common';
import { Sequelize, SyncOptions } from 'sequelize';
import { OptionAutoload, Taxonomy } from '../../entities';
import { OptionPresetKeys, UserMetaPresetKeys } from '../../utils/preset-keys.util';
import { UserRole, getDefaultUserRoles } from '../../utils/user-capability.util';
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
  // haveTables(): Promise<boolean> {
  //   if (this.databaseDialect === 'mysql') {
  //     return this.sequelize
  //       .query(
  //         'select count(1) as tableCount from `INFORMATION_SCHEMA`.`TABLES` where `TABLE_SCHEMA`= (select database())',
  //       )
  //       .then(([value]) => {
  //         // 当没有表的时候初始化
  //         return (value as any)[0].tableCount > 0;
  //       });
  //   } else {
  //     // todo: 其它数据库
  //     this.logger.warn(`${this.databaseDialect} is not supported!`);
  //     return Promise.resolve(true);
  //   }
  // }

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
      // 初始化admin用户
      const admin = await this.models.Users.create(
        {
          loginName: 'admin',
          loginPwd: md5(initArgs.password),
          niceName: 'Admin',
          displayName: 'Admin',
          mobile: '',
          email: initArgs.email,
          url: '',
        },
        {
          transaction: t,
        },
      );

      await this.models.UserMeta.bulkCreate(
        [
          { userId: admin.id, metaKey: UserMetaPresetKeys.NickName, metaValue: 'Admin' },
          { userId: admin.id, metaKey: UserMetaPresetKeys.FirstName, metaValue: '' },
          { userId: admin.id, metaKey: UserMetaPresetKeys.LastName, metaValue: '' },
          { userId: admin.id, metaKey: UserMetaPresetKeys.Avatar, metaValue: '' },
          { userId: admin.id, metaKey: UserMetaPresetKeys.Description, metaValue: 'Administrator' },
          { userId: admin.id, metaKey: UserMetaPresetKeys.Locale, metaValue: '' },
          { userId: admin.id, metaKey: UserMetaPresetKeys.AdminColor, metaValue: '' },
          { userId: admin.id, metaKey: UserMetaPresetKeys.SuperAdministrator, metaValue: '1' },
          {
            userId: admin.id,
            metaKey: `${this.tablePrefix}${UserMetaPresetKeys.Capabilities}`,
            metaValue: UserRole.Administrator,
          },
        ],
        {
          transaction: t,
        },
      );

      // 初始化默认分类
      const defaultPostCategoryTaxonomy = await this.models.TermTaxonomy.create(
        { name: 'Uncategorized', slug: 'uncategorized', taxonomy: Taxonomy.Category, description: '' },
        {
          transaction: t,
        },
      );

      const defaultLinkCategoryTaxonomy = await this.models.TermTaxonomy.create(
        {
          name: 'Uncategorized Link',
          slug: 'uncategorized link',
          taxonomy: Taxonomy.Category,
          description: '',
          group: 1,
        },
        {
          transaction: t,
        },
      );

      const defaultMediaCategoryTaxonomy = await this.models.TermTaxonomy.create(
        {
          name: 'Uncategorized Medias',
          slug: 'uncategorized medias',
          taxonomy: Taxonomy.Category,
          description: '',
          group: 2,
        },
        {
          transaction: t,
        },
      );

      const timezoneOffset = -new Date().getTimezoneOffset();
      // 初始化配置参数
      await this.models.Options.bulkCreate(
        [
          { optionName: OptionPresetKeys.SiteUrl, optionValue: initArgs.siteUrl },
          { optionName: OptionPresetKeys.Home, optionValue: initArgs.homeUrl },
          { optionName: OptionPresetKeys.BlogName, optionValue: initArgs.title },
          { optionName: OptionPresetKeys.BlogDescription, optionValue: 'Just another Pomelo site' },
          { optionName: OptionPresetKeys.BlogCharset, optionValue: 'UTF-8' },
          { optionName: OptionPresetKeys.SiteIcon, optionValue: '' },
          { optionName: OptionPresetKeys.UsersCanRegister, optionValue: '0' },
          { optionName: OptionPresetKeys.AdminEmail, optionValue: initArgs.email },
          {
            optionName: OptionPresetKeys.AdminEmialLifespan,
            optionValue: String(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000),
          },
          { optionName: OptionPresetKeys.StartOfWeek, optionValue: '1' },
          { optionName: OptionPresetKeys.MailServerUrl, optionValue: 'mail.example.com' },
          { optionName: OptionPresetKeys.MailServerLogin, optionValue: 'login@example.com' },
          { optionName: OptionPresetKeys.MailServerPass, optionValue: 'password' },
          { optionName: OptionPresetKeys.MailServerPort, optionValue: '110' },
          { optionName: OptionPresetKeys.DefaultComentStatus, optionValue: 'open' },
          { optionName: OptionPresetKeys.DefaultCategory, optionValue: String(defaultPostCategoryTaxonomy.id) },
          { optionName: OptionPresetKeys.DefaultEmailCategory, optionValue: String(defaultPostCategoryTaxonomy.id) },
          { optionName: OptionPresetKeys.DefaultLinkCategory, optionValue: String(defaultLinkCategoryTaxonomy.id) },
          { optionName: OptionPresetKeys.DefaultMediaCategory, optionValue: String(defaultMediaCategoryTaxonomy.id) },
          { optionName: OptionPresetKeys.CommentsNotify, optionValue: '1' },
          { optionName: OptionPresetKeys.PostsPerPage, optionValue: '10' },
          { optionName: OptionPresetKeys.DataFormat, optionValue: 'L' },
          { optionName: OptionPresetKeys.TimeFormat, optionValue: 'HH:mm:ss' },
          { optionName: OptionPresetKeys.CommentModeration, optionValue: '0' },
          { optionName: OptionPresetKeys.ModerationNofity, optionValue: '1' },
          { optionName: OptionPresetKeys.CommentRegistration, optionValue: '0' },
          { optionName: OptionPresetKeys.CommentMaxLinks, optionValue: '2' },
          { optionName: OptionPresetKeys.ThreadComments, optionValue: '1' },
          { optionName: OptionPresetKeys.ThreadCommentsDepth, optionValue: '5' },
          { optionName: OptionPresetKeys.PageComments, optionValue: '0' },
          { optionName: OptionPresetKeys.CommentsPerPage, optionValue: '50' },
          { optionName: OptionPresetKeys.DefaultCommentsPage, optionValue: 'newest' },
          { optionName: OptionPresetKeys.CommentOrder, optionValue: 'asc' },
          { optionName: OptionPresetKeys.PermalinkStructure, optionValue: '' },
          { optionName: OptionPresetKeys.ActivePlugins, optionValue: '[]' },
          { optionName: OptionPresetKeys.UninstallPlugins, optionValue: '[]', autoload: OptionAutoload.No },
          { optionName: OptionPresetKeys.Template, optionValue: 'beauty' },
          { optionName: OptionPresetKeys.Stylesheet, optionValue: 'beauty' },

          { optionName: OptionPresetKeys.GmtOffset, optionValue: String(timezoneOffset / 60) },
          {
            optionName: OptionPresetKeys.TimezoneString,
            optionValue: `${timezoneOffset >= 0 ? '+' : '-'}${String(
              parseInt(String(Math.abs(timezoneOffset / 60))),
            ).padStart(2, '0')}:${String(Math.abs(timezoneOffset % 60)).padStart(2, '0')}`,
          },
          { optionName: OptionPresetKeys.DefaultRole, optionValue: UserRole.Subscriber },
          { optionName: OptionPresetKeys.ShowOnFront, optionValue: 'posts' },
          { optionName: OptionPresetKeys.PageForPosts, optionValue: '' },
          { optionName: OptionPresetKeys.PageOnFront, optionValue: '' },
          { optionName: OptionPresetKeys.DefaultPostFormat, optionValue: 'aside' },
          { optionName: OptionPresetKeys.ShowAvatars, optionValue: '1' },
          { optionName: OptionPresetKeys.AvatarRating, optionValue: 'G' },
          { optionName: OptionPresetKeys.AvatarDefault, optionValue: 'default.png' },
          { optionName: OptionPresetKeys.ThumbnailSizeWidth, optionValue: '150' },
          { optionName: OptionPresetKeys.ThumbnailSizeHeight, optionValue: '150' },
          { optionName: OptionPresetKeys.ThumbnailCrop, optionValue: '1' },
          { optionName: OptionPresetKeys.MediumSizeWidth, optionValue: '300' },
          { optionName: OptionPresetKeys.MediumSizeHeight, optionValue: '300' },
          { optionName: OptionPresetKeys.MediumLargeSizeWidth, optionValue: '768' },
          { optionName: OptionPresetKeys.MediumLargeSizeHeight, optionValue: '0' },
          { optionName: OptionPresetKeys.LargeSizeWidth, optionValue: '1200' },
          { optionName: OptionPresetKeys.LargeSizeHeight, optionValue: '1200' },
          { optionName: OptionPresetKeys.ImageDefaultLinkType, optionValue: '' },
          { optionName: OptionPresetKeys.ImageDefaultSize, optionValue: '' },
          { optionName: OptionPresetKeys.ImageDefaultAlign, optionValue: '' },
          { optionName: OptionPresetKeys.CanCompressScripts, optionValue: '0' },
          { optionName: OptionPresetKeys.DefaultPhoneNumberRegion, optionValue: 'CN' },
          // 带数据库前缀属性
          { optionName: `${this.tablePrefix}${OptionPresetKeys.Locale}`, optionValue: initArgs.locale },
          {
            optionName: `${this.tablePrefix}${OptionPresetKeys.UserRoles}`,
            optionValue: JSON.stringify(getDefaultUserRoles()),
          },
          { optionName: `${this.tablePrefix}${OptionPresetKeys.PageForPrivacyPolicy}`, optionValue: '' },
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
