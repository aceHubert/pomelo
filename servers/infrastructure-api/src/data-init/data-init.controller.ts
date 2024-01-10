import { HttpAdapterHost } from '@nestjs/core';
import { Controller, Get, Post, Body, Request, Scope } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { I18n, I18nContext } from 'nestjs-i18n';
import { BaseController } from '@/common/controllers/base.controller';
import { DataInitService } from './data-init.service';
import { InitArgsDto } from './dto/init-args.dto';

@ApiExcludeController()
@Controller({ path: 'api', scope: Scope.REQUEST })
export class DataInitController extends BaseController {
  constructor(private readonly httpAdapterHost: HttpAdapterHost, private readonly dbInitService: DataInitService) {
    super();
  }

  /**
   * Has database been initialized
   */
  @Get('check')
  async check(@I18n() i18n: I18nContext) {
    const result = this.dbInitService.hasDatasInitialed();
    return this.success({
      dbInitRequired: result,
      message: result
        ? i18n.tv('db-init.controller.init_datas.required', 'Datas initializing is required!')
        : i18n.tv('db-init.controller.init_datas.completed', 'Datas have already initialized!'),
    });
  }

  /**
   * Sync database and initialize datas if database has not been initialized
   */
  @Post('start')
  async start(@Request() request: any, @Body() initArgs: InitArgsDto, @I18n() i18n: I18nContext) {
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
      await this.dbInitService.initDatas({
        ...initArgs,
        siteUrl,
      });

      return this.success({
        message: i18n.tv('db-init.controller.init_datas.success', 'Initialize datas successful!'),
      });
    } catch (err) {
      this.logger.error(err);
      return this.faild(i18n.tv('db-init.controller.init_datas.fail', 'An error occurred while initializing datas!'));
    }
  }
}
