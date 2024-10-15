import { Controller, Get, Render, HttpException } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
import { parseURL } from 'ioredis/built/utils';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  MicroserviceHealthIndicator,
  HealthIndicatorFunction,
  HealthCheckResult,
} from '@nestjs/terminus';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(
    private readonly config: ConfigService,
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly microservice: MicroserviceHealthIndicator,
  ) {}

  /**
   * 启动 root 页面
   */
  @Get()
  @Render('index')
  index() {
    return { layout: false };
  }

  @Get('health')
  @HealthCheck()
  async healthCheck(): Promise<HealthCheckResult> {
    const indicatorFunctions: HealthIndicatorFunction[] = [];

    indicatorFunctions.push(() =>
      this.microservice.pingCheck('infrastructure-service', {
        transport: Transport.TCP,
        options: {
          host: this.config.get('INFRASTRUCTURE_SERVICE_HOST', ''),
          port: this.config.get('INFRASTRUCTURE_SERVICE_PORT', 3000),
        },
      }),
    );

    let redisUrl: string | undefined;
    if ((redisUrl = this.config.get('REDIS_URL'))) {
      indicatorFunctions.push(() =>
        this.microservice.pingCheck('redis', {
          transport: Transport.REDIS,
          options: parseURL(redisUrl!),
        }),
      );
    }

    indicatorFunctions.push(() => this.http.pingCheck('nestjs-docs', 'https://docs.nestjs.com'));

    return this.health.check(indicatorFunctions).catch((error) => {
      if (error instanceof HttpException) {
        return error.getResponse() as HealthCheckResult;
      }
      throw error;
    });
  }
}
