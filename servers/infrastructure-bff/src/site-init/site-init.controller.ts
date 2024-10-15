import { HttpAdapterHost } from '@nestjs/core';
import { Inject, Controller, Get, Post, Body, Request, Scope } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiExcludeController } from '@nestjs/swagger';
import { I18n, I18nContext } from 'nestjs-i18n';
import { INFRASTRUCTURE_SERVICE, SiteInitPattern } from '@ace-pomelo/shared/server';
import { BaseController } from '@/common/controllers/base.controller';
import { SiteInitArgsDto } from './dto/init-args.dto';

@ApiExcludeController()
@Controller({ path: 'api', scope: Scope.REQUEST })
export class SiteInitController extends BaseController {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    @Inject(INFRASTRUCTURE_SERVICE) private readonly basicService: ClientProxy,
  ) {
    super();
  }

  /**
   * It is required to initial site before running.
   */
  @Get('check')
  async check(@I18n() i18n: I18nContext) {
    const needInitDates = await this.basicService.send<boolean>(SiteInitPattern.IsRequired, {}).lastValue();
    return this.success({
      siteInitRequired: needInitDates,
      message: needInitDates
        ? i18n.tv('common.site_init.required', 'Site datas initialization is required!')
        : i18n.tv('common.site_init.completed', 'Site datas have already initialized!'),
    });
  }

  /**
   * Start to initialize site datas.
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
      await this.basicService
        .send<void>(SiteInitPattern.Start, {
          ...initArgs,
          siteUrl,
        })
        .lastValue();

      return this.success({
        message: i18n.tv('common.site_init.success', 'Site datas initialize successful!'),
      });
    } catch (err) {
      this.logger.error(err);
      return this.faild(i18n.tv('common.site_init.fail', 'An error occurred while initializing site datas!'));
    }
  }
}
