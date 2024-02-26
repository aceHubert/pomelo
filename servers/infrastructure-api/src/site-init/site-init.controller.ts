import { HttpAdapterHost } from '@nestjs/core';
import { Controller, Get, Post, Body, Request, Scope } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { I18n, I18nContext } from 'nestjs-i18n';
import { BaseController } from '@/common/controllers/base.controller';
import { IgnoreDbCheckInterceptor } from '@/common/interceptors/db-check.interceptor';
import { SiteInitService } from './site-init.service';
import { SiteInitArgsDto } from './dto/init-args.dto';

@ApiExcludeController()
@IgnoreDbCheckInterceptor()
@Controller({ path: 'api', scope: Scope.REQUEST })
export class SiteInitController extends BaseController {
  constructor(private readonly httpAdapterHost: HttpAdapterHost, private readonly siteInitService: SiteInitService) {
    super();
  }

  /**
   * It is required to initial database before running site.
   */
  @Get('check')
  async check(@I18n() i18n: I18nContext) {
    const needInitDates = this.siteInitService.initialRequired();
    return this.success({
      siteInitRequired: needInitDates,
      message: needInitDates
        ? i18n.tv('site-init.required', 'Site datas initialization is required!')
        : i18n.tv('site-init.completed', 'Site datas have already initialized!'),
    });
  }

  /**
   * Sync database and initialize datas if database has not been initialized
   */
  @Post('start')
  async start(@Body() initArgs: SiteInitArgsDto, @Request() request: any, @I18n() i18n: I18nContext) {
    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const platformName = httpAdapter.getType();

    let siteUrl = '';
    if (platformName === 'express') {
      siteUrl = `${request.protocol}://${request.get('host')}`;
    } else {
      // else if (platformName === 'fastify') {
      this.logger.warn(`server platform "${platformName}" is not support!`);
    }

    try {
      await this.siteInitService.initialize({
        ...initArgs,
        siteUrl,
      });

      return this.success({
        message: i18n.tv('site-init.success', 'Site datas initialize successful!'),
      });
    } catch (err) {
      this.logger.error(err);
      return this.faild(i18n.tv('site-init.fail', 'An error occurred while initializing site datas!'));
    }
  }
}
