import { Controller, Get, HttpException } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  HealthIndicatorFunction,
  HealthCheckResult,
} from '@nestjs/terminus';
import { IgnoreDbCheckInterceptor } from '@/common/interceptors/db-check.interceptor';
import { AppService } from './app.service';

@IgnoreDbCheckInterceptor()
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
  ) {}

  /**
   * 启动 root 页面 return 'Hello World!'
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @HealthCheck()
  async healthCheck(): Promise<HealthCheckResult> {
    const indicatorFunctions: HealthIndicatorFunction[] = [];

    indicatorFunctions.push(() => this.http.pingCheck('nestjs-docs', 'https://docs.nestjs.com'));

    return this.health.check(indicatorFunctions).catch((error) => {
      if (error instanceof HttpException) {
        return error.getResponse() as HealthCheckResult;
      }
      throw error;
    });
  }
}
