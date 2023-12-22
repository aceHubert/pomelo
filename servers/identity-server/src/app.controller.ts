import { Controller, Get, Render } from '@nestjs/common';

@Controller()
export class AppController {
  constructor() {}

  /**
   * 启动 root 页面
   */
  @Get()
  @Render('index')
  index() {
    return { layout: false };
  }
}
