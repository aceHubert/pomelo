import { upperFirst } from 'lodash';
import { UniqueConstraintError } from 'sequelize';
import { Controller, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  md5,
  FileEnv,
  OptionPresetKeys,
  UserMetaPresetKeys,
  UserRole,
  UserStatus,
  OptionAutoload,
} from '@ace-pomelo/shared/server';
import { Empty } from '@ace-pomelo/shared/server/proto-ts/google/protobuf/empty';
import { BoolValue } from '@ace-pomelo/shared/server/proto-ts/google/protobuf/wrappers';
import {
  SiteInitServiceControllerMethods,
  SiteInitServiceController,
  StartOptionRequest,
} from '@ace-pomelo/shared/server/proto-ts/site-init';
import { IgnoreDbCheckInterceptor } from '@/common/interceptors/db-check.interceptor';
import { getDefaultUserRoles } from '@/common/utils/user.util';
import { getDbLockFileEnv } from '@/common/utils/lock-file.util';
import { name, InfrastructureDatasourceService, UserDataSource, TermPresetTaxonomy } from '../datasource';
import { version } from '../version';

@IgnoreDbCheckInterceptor()
@Controller()
@SiteInitServiceControllerMethods()
export class SiteInitController implements SiteInitServiceController {
  private logger = new Logger(SiteInitController.name, { timestamp: true });
  private readonly adminName = 'admin';
  private readonly fileEnv: FileEnv;

  constructor(
    private readonly datasourceService: InfrastructureDatasourceService,
    private readonly userDataSource: UserDataSource,
    readonly configService: ConfigService,
  ) {
    this.fileEnv = getDbLockFileEnv(configService);
  }

  private checkAdminExists() {
    return this.userDataSource.isLoginNameExists(this.adminName);
  }

  /**
   * Check if the datas is required to be initialized
   */
  async isRequired(): Promise<BoolValue> {
    if (this.fileEnv.getEnv(name) === 'PENDING') {
      if (await this.checkAdminExists()) {
        this.fileEnv.setEnv(name, version);
        this.logger.debug('Datas already initialized!');
        return { value: false };
      } else {
        return { value: true };
      }
    }
    return { value: false };
  }

  /**
   * Initialize the datas
   */
  async start({ title, password, email, homeUrl, siteUrl, locale }: StartOptionRequest): Promise<Empty> {
    if (await this.isRequired()) {
      this.logger.debug('Start to initialize datas!');
      try {
        const timezoneOffset = -new Date().getTimezoneOffset();
        await this.datasourceService.initDatas({
          users: [
            {
              loginName: this.adminName,
              loginPwd: md5(password),
              niceName: upperFirst(this.adminName),
              displayName: upperFirst(this.adminName),
              email: email,
              url: '',
              status: UserStatus.Enabled,
              metas: [
                { metaKey: UserMetaPresetKeys.NickName, metaValue: 'Admin' },
                { metaKey: UserMetaPresetKeys.FirstName, metaValue: '' },
                { metaKey: UserMetaPresetKeys.LastName, metaValue: '' },
                { metaKey: UserMetaPresetKeys.Avatar, metaValue: '' },
                { metaKey: UserMetaPresetKeys.Description, metaValue: 'Administrator' },
                { metaKey: UserMetaPresetKeys.Locale, metaValue: '' },
                { metaKey: UserMetaPresetKeys.AdminColor, metaValue: '' },
                { metaKey: UserMetaPresetKeys.SuperAdministrator, metaValue: '1' },
                // 带数据库前缀属性
                {
                  metaKey: UserMetaPresetKeys.Capabilities,
                  metaValue: UserRole.Administrator,
                  keyWithTablePrefix: true,
                },
              ],
            },
          ],
          options: [
            { optionName: OptionPresetKeys.SiteUrl, optionValue: siteUrl },
            { optionName: OptionPresetKeys.Home, optionValue: homeUrl },
            { optionName: OptionPresetKeys.BlogName, optionValue: title },
            { optionName: OptionPresetKeys.BlogDescription, optionValue: 'Just another Pomelo site' },
            { optionName: OptionPresetKeys.BlogCharset, optionValue: 'UTF-8' },
            { optionName: OptionPresetKeys.SiteIcon, optionValue: '' },
            { optionName: OptionPresetKeys.UsersCanRegister, optionValue: '0' },
            { optionName: OptionPresetKeys.AdminEmail, optionValue: email },
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
            {
              optionName: OptionPresetKeys.Locale,
              optionValue: locale,
              nameWithTablePrefix: true,
            },
            {
              optionName: OptionPresetKeys.UserRoles,
              optionValue: JSON.stringify(getDefaultUserRoles()),
              nameWithTablePrefix: true,
            },
            {
              optionName: OptionPresetKeys.PageForPrivacyPolicy,
              optionValue: '',
              nameWithTablePrefix: true,
            },
          ],
          taxonomies: [
            {
              name: 'Uncategorized',
              slug: '未分类',
              taxonomy: TermPresetTaxonomy.Category,
              description: '',
              optionName: OptionPresetKeys.DefaultCategory,
            },
          ],
          templates: [
            {
              name: '',
              title: 'Pomelo blog system',
              content: 'A blog system based on Nest.js.',
              excerpt: '',
            },
          ],
        });
        this.fileEnv.setEnv(name, version);
        this.logger.debug('Initialize datas successful!');
        // TODO: Add client redirect uris
      } catch (err) {
        if (err instanceof UniqueConstraintError) {
          this.fileEnv.setEnv(name, version);
          this.logger.debug('Datas already initialized!');
        } else {
          throw err;
        }
      }
    } else {
      this.logger.debug('Datas lready initialized!');
    }
    return {};
  }
}
