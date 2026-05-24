import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HealthCheckService, HttpHealthIndicator, MicroserviceHealthIndicator } from '@nestjs/terminus';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: HealthCheckService, useValue: { check: jest.fn() } },
        { provide: HttpHealthIndicator, useValue: { pingCheck: jest.fn() } },
        { provide: MicroserviceHealthIndicator, useValue: { pingCheck: jest.fn() } },
      ],
    }).compile();

    appService = app.get<AppService>(AppService);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appService.getHello()).toEqual('Hello World!');
    });
  });
});
