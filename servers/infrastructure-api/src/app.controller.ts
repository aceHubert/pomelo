import { Controller, Get } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { IgnoreDbCheckInterceptor } from '@/common/interceptors/db-check.interceptor';
import { AppService } from './app.service';

@IgnoreDbCheckInterceptor()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * 启动 root 页面 return 'Hello World!'
   */
  @ApiExcludeEndpoint()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
