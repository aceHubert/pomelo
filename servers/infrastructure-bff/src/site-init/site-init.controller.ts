import { HttpAdapterHost } from '@nestjs/core';
import { Inject, Controller, Get, Post, Body, Request, Scope, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { ApiExcludeController } from '@nestjs/swagger';
import { I18n, I18nContext } from 'nestjs-i18n';
import { POMELO_SERVICE_PACKAGE_NAME } from '@ace-pomelo/shared/server';
import { SiteInitServiceClient, SITE_INIT_SERVICE_NAME } from '@ace-pomelo/shared/server/proto-ts/site-init';
import { BaseController } from '@/common/controllers/base.controller';
import { SiteInitArgsDto } from './dto/init-args.dto';

@ApiExcludeController()
@Controller({ path: 'api', scope: Scope.REQUEST })
export class SiteInitController extends BaseController implements OnModuleInit {
  private siteInitServiceClient!: SiteInitServiceClient;

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    @Inject(POMELO_SERVICE_PACKAGE_NAME) private readonly client: ClientGrpc,
  ) {
    super();
  }

  onModuleInit() {
    this.siteInitServiceClient = this.client.getService<SiteInitServiceClient>(SITE_INIT_SERVICE_NAME);
  }

  /**
   * It is required to initial site before running.
   */
  @Get('check')
  async check(@I18n() i18n: I18nContext) {
    const { value: needInitDates } = await this.siteInitServiceClient.isRequired({}).lastValue();
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
      await this.siteInitServiceClient
        .start({
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
