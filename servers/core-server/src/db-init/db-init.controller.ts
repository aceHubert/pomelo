import { HttpAdapterHost } from '@nestjs/core';
import { Logger, Controller, Get, Post, Body, Request, Scope } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { I18n, I18nContext } from 'nestjs-i18n';
import { BaseController } from '@pomelo/shared';
import { DbInitService } from './db-init.service';
import { InitArgsDto } from './dto/init-args.dto';

@ApiExcludeController()
@Controller({ path: 'api/db-init', scope: Scope.REQUEST })
export class DbInitController extends BaseController {
  private readonly logger = new Logger('DbInitController');

  constructor(private readonly httpAdapterHost: HttpAdapterHost, private readonly dbInitService: DbInitService) {
    super();
  }

  /**
   * Has database been initialized
   */
  @Get('check')
  async check() {
    const result = await this.dbInitService.hasDbInitialized();
    return this.success({
      dbInitRequired: !result,
    });
  }

  /**
   * Sync database and initialize datas if database has not been initialized
   */
  @Post('start')
  async start(@Request() request: any, @Body() initArgs: InitArgsDto, @I18n() i18n: I18nContext) {
    const result = await this.dbInitService.initDb();

    // true 第一次建表, 初始化数据
    if (result) {
      const httpAdapter = this.httpAdapterHost.httpAdapter;
      const platformName = httpAdapter.getType();

      let siteUrl = '';
      if (platformName === 'express') {
        siteUrl = `${request.protocol}://${request.get('host')}`;
      } else {
        // else if (platformName === 'fastify') {
        this.logger.warn(`server platform "${platformName}" is not support!`);
      }
      const success = await this.dbInitService.initDatas({
        ...initArgs,
        siteUrl,
      });
      return success
        ? this.success({
            message: await i18n.tv('db-init.controller.init_data.success', 'Initialize datas successful!'),
          })
        : this.faild(
            await i18n.tv('db-init.controller.init_data.faild', 'An error occurred while initializing datas!'),
            400,
          );
    } else {
      // 已经存在表结构，直接返回成功
      return this.success({
        message: await i18n.tv('db-init.controller.init_database.success', 'Initialize database successful!'),
      });
    }
  }
}
