import { Controller, Get, HttpException } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  MicroserviceHealthIndicator,
  HealthIndicatorFunction,
  HealthCheckResult,
} from '@nestjs/terminus';
import { AppService } from './app.service';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly config: ConfigService,
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly microservice: MicroserviceHealthIndicator,
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

    indicatorFunctions.push(() =>
      this.microservice.pingCheck('infrastructure-service', {
        transport: Transport.GRPC,
        options: {
          host: this.config.get('INFRASTRUCTURE_GRPC_HOST', 'localhost'),
          port: this.config.getOrThrow('INFRASTRUCTURE_GRPC_PORT'),
        },
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
