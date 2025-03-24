import { Test, TestingModule } from '@nestjs/testing';
import { HttpAdapterHost } from '@nestjs/core';
import { ClientGrpc } from '@nestjs/microservices';
import { I18nContext } from 'nestjs-i18n';
import { of, throwError } from 'rxjs';
import { POMELO_SERVICE_PACKAGE_NAME } from '@ace-pomelo/shared/server';
import { SiteInitServiceClient } from '@ace-pomelo/shared/server/proto-ts/site-init';
import { SiteInitController } from '../site-init.controller';
import { SiteInitArgsDto } from '../dto/init-args.dto';

describe('SiteInitController', () => {
  let controller: SiteInitController;
  let mockHttpAdapterHost: jest.Mocked<HttpAdapterHost>;
  let mockClientGrpc: jest.Mocked<ClientGrpc>;
  let mockSiteInitServiceClient: jest.Mocked<SiteInitServiceClient>;
  let mockI18n: jest.Mocked<I18nContext>;

  beforeEach(async () => {
    mockSiteInitServiceClient = {
      isRequired: jest.fn(),
      start: jest.fn(),
    } as any;

    mockClientGrpc = {
      getService: jest.fn().mockReturnValue(mockSiteInitServiceClient),
    } as any;

    mockHttpAdapterHost = {
      httpAdapter: {
        getType: jest.fn().mockReturnValue('express'),
      },
    } as any;

    mockI18n = {
      tv: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SiteInitController],
      providers: [
        {
          provide: HttpAdapterHost,
          useValue: mockHttpAdapterHost,
        },
        {
          provide: POMELO_SERVICE_PACKAGE_NAME,
          useValue: mockClientGrpc,
        },
      ],
    }).compile();

    controller = module.get<SiteInitController>(SiteInitController);
  });

  describe('check', () => {
    it('应该返回需要初始化的状态和对应消息', async () => {
      mockSiteInitServiceClient.isRequired.mockReturnValue(of({ value: true }));
      mockI18n.tv.mockReturnValue('Site datas initialization is required!');

      const result = await controller.check(mockI18n);

      expect(result).toEqual({
        siteInitRequired: true,
        message: 'Site datas initialization is required!',
      });
      expect(mockI18n.tv).toHaveBeenCalledWith('common.site_init.required', 'Site datas initialization is required!');
    });

    it('应该返回已初始化的状态和对应消息', async () => {
      mockSiteInitServiceClient.isRequired.mockReturnValue(of({ value: false }));
      mockI18n.tv.mockReturnValue('Site datas have already initialized!');

      const result = await controller.check(mockI18n);

      expect(result).toEqual({
        siteInitRequired: false,
        message: 'Site datas have already initialized!',
      });
      expect(mockI18n.tv).toHaveBeenCalledWith('common.site_init.completed', 'Site datas have already initialized!');
    });
  });

  describe('start', () => {
    const mockRequest = {
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost:3000'),
    };

    const mockInitArgs: SiteInitArgsDto = {
      title: 'Test Site',
      password: 'password123',
      email: 'test@example.com',
      homeUrl: 'http://localhost:3000',
      locale: 'zh-CN',
    };

    it('应该成功初始化站点并返回成功消息', async () => {
      mockSiteInitServiceClient.start.mockReturnValue(of({}));
      mockI18n.tv.mockReturnValue('Site datas initialize successful!');

      const result = await controller.start(mockInitArgs, mockRequest, mockI18n);

      expect(result).toEqual({
        message: 'Site datas initialize successful!',
      });
      expect(mockSiteInitServiceClient.start).toHaveBeenCalledWith({
        ...mockInitArgs,
        siteUrl: 'http://localhost:3000',
      });
      expect(mockI18n.tv).toHaveBeenCalledWith('common.site_init.success', 'Site datas initialize successful!');
    });

    it('应该处理初始化失败的情况并返回错误消息', async () => {
      mockSiteInitServiceClient.start.mockReturnValue(throwError(() => new Error('Initialization failed')));
      mockI18n.tv.mockReturnValue('An error occurred while initializing site datas!');

      const result = await controller.start(mockInitArgs, mockRequest, mockI18n);

      expect(result).toEqual({
        message: 'An error occurred while initializing site datas!',
      });
      expect(mockI18n.tv).toHaveBeenCalledWith(
        'common.site_init.fail',
        'An error occurred while initializing site datas!',
      );
    });

    // it('应该处理非 express 平台的情况', async () => {
    //   mockHttpAdapterHost.httpAdapter.getType.mockReturnValue(of('fastify'));
    //   mockSiteInitServiceClient.start.mockResolvedValue({});
    //   mockI18n.tv.mockReturnValue('Site datas initialize successful!');

    //   const result = await controller.start(mockInitArgs, mockRequest, mockI18n);

    //   expect(result).toEqual({
    //     message: 'Site datas initialize successful!',
    //   });
    //   expect(mockSiteInitServiceClient.start).toHaveBeenCalledWith({
    //     ...mockInitArgs,
    //     siteUrl: '',
    //   });
    // });
  });
});
