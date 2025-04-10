import { Controller, Get, Render, HttpException } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { RedisOptions, Transport } from '@nestjs/microservices';
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
        transport: Transport.GRPC,
        options: {
          host: this.config.get('INFRASTRUCTURE_GRPC_HOST', 'localhost'),
          port: this.config.getOrThrow('INFRASTRUCTURE_GRPC_PORT'),
        },
      }),
    );

    let redisUrl: string | undefined, redisOptions: RedisOptions['options'] | undefined;
    if ((redisUrl = this.config.get('REDIS_URL'))) {
      redisOptions = parseURL(redisUrl);
    } else if ((redisUrl = this.config.get('REDIS_HOST'))) {
      redisOptions = {
        host: this.config.get('REDIS_HOST'),
        port: this.config.get('REDIS_PORT', 6379),
        username: this.config.get('REDIS_USERNAME'),
        password: this.config.get('REDIS_PASSWORD'),
        db: this.config.get('REDIS_DB', 0),
      };
    }

    redisOptions &&
      indicatorFunctions.push(() =>
        this.microservice.pingCheck('redis', {
          transport: Transport.REDIS,
          options: redisOptions,
        }),
      );

    indicatorFunctions.push(() => this.http.pingCheck('nestjs-docs', 'https://docs.nestjs.com'));

    return this.health.check(indicatorFunctions).catch((error) => {
      if (error instanceof HttpException) {
        return error.getResponse() as HealthCheckResult;
      }
      throw error;
    });
  }
}
