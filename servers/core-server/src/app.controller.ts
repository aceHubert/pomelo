import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * 启动 root 页面 return 'Hello World!'
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
