import path from 'path';
import { UniqueConstraintError } from 'sequelize';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  md5,
  FileEnv,
  UserStatus,
  UserRole,
  OptionAutoload,
  OptionPresetKeys,
  TermPresetTaxonomy,
  UserMetaPresetKeys,
  SiteInitPattern,
} from '@ace-pomelo/shared/server';
import { IgnoreDbCheckInterceptor } from '@/common/interceptors/db-check.interceptor';
import { getDefaultUserRoles } from '@/common/utils/user.util';
import { version } from '../version';
import { name, InfrastructureDatasourceService } from '../datasource';
import { SiteInitPayload } from './payload/site-init.payload';

@IgnoreDbCheckInterceptor()
@Controller()
export class SiteInitController {
  private logger = new Logger(SiteInitController.name, { timestamp: true });
  private readonly fileEnv: FileEnv;

  constructor(private readonly infrastructureDatasourceService: InfrastructureDatasourceService) {
    this.fileEnv = FileEnv.getInstance(path.join(process.cwd(), '..', 'db.lock'));
  }

  @MessagePattern(SiteInitPattern.IsRequired)
  isRequired() {
    return this.fileEnv.getEnv(name) === 'PENDING';
  }

  /**
   * Initialize the datas
   */
  @MessagePattern(SiteInitPattern.Start)
  async start(@Payload() payload: SiteInitPayload) {
    if (this.isRequired()) {
      this.logger.debug('Start to initialize datas!');
      try {
        const timezoneOffset = -new Date().getTimezoneOffset();
        await this.infrastructureDatasourceService.initDatas({
          users: [
            {
              loginName: 'admin',
              loginPwd: md5(payload.password),
              niceName: 'Admin',
              displayName: 'Admin',
              email: payload.email,
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
            { optionName: OptionPresetKeys.SiteUrl, optionValue: payload.siteUrl },
            { optionName: OptionPresetKeys.Home, optionValue: payload.homeUrl },
            { optionName: OptionPresetKeys.BlogName, optionValue: payload.title },
            { optionName: OptionPresetKeys.BlogDescription, optionValue: 'Just another Pomelo site' },
            { optionName: OptionPresetKeys.BlogCharset, optionValue: 'UTF-8' },
            { optionName: OptionPresetKeys.SiteIcon, optionValue: '' },
            { optionName: OptionPresetKeys.UsersCanRegister, optionValue: '0' },
            { optionName: OptionPresetKeys.AdminEmail, optionValue: payload.email },
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
              optionValue: payload.locale,
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
  }
}
