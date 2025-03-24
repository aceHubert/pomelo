import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Response } from 'express';
import { of, throwError } from 'rxjs';
import { ResponseError, POMELO_SERVICE_PACKAGE_NAME } from '@ace-pomelo/shared/server';
import { TemplateServiceClient } from '@ace-pomelo/shared/server/proto-ts/template';
import { PostTemplateController } from '../post.controller';

describe('PostTemplateController', () => {
  let controller: PostTemplateController;
  let mockClientGrpc: jest.Mocked<ClientGrpc>;
  let mockTemplateServiceClient: jest.Mocked<TemplateServiceClient>;

  beforeEach(async () => {
    mockTemplateServiceClient = {
      getOptions: jest.fn(),
      getByName: jest.fn(),
      get: jest.fn(),
      getPaged: jest.fn(),
      createPost: jest.fn(),
      update: jest.fn(),
      getMetas: jest.fn(),
    } as any;

    mockClientGrpc = {
      getService: jest.fn().mockReturnValue(mockTemplateServiceClient),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostTemplateController],
      providers: [
        {
          provide: POMELO_SERVICE_PACKAGE_NAME,
          useValue: mockClientGrpc,
        },
      ],
    }).compile();

    controller = module.get<PostTemplateController>(PostTemplateController);
  });

  describe('getOptions', () => {
    it('should return empty options array', async () => {
      mockTemplateServiceClient.getOptions.mockReturnValue(of({ options: [] }));
      const result = await controller.getOptions({});
      expect(result.data).toHaveLength(0);
    });
  });

  describe('getByName', () => {
    it('should return 204 when template not found', async () => {
      mockTemplateServiceClient.getByName.mockReturnValue(of({ template: undefined }));
      const mockResponse = {
        status: jest.fn(),
      } as unknown as Response;

      const result = await controller.getByName('test', undefined, mockResponse, undefined);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
      expect(result.data).toBeUndefined();
    });
  });

  describe('get', () => {
    it('should return 204 when template not found', async () => {
      mockTemplateServiceClient.get.mockReturnValue(of({ template: undefined }));
      const mockResponse = {
        status: jest.fn(),
      } as unknown as Response;

      const result = await controller.get(1, undefined, mockResponse, undefined);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
      expect(result.data).toBeUndefined();
    });
  });

  describe('get template with metas', () => {
    it('should return template with meta array', async () => {
      mockTemplateServiceClient.get.mockReturnValue(
        of({
          template: {
            id: 1,
            name: 'test',
            title: 'Test Template',
            author: 1,
            content: 'test content',
            excerpt: '',
            type: 'post',
            order: 0,
            status: 'draft',
            commentStatus: 'open',
            commentCount: 0,
            updatedAt: new Date(),
            createdAt: new Date(),
          },
        }),
      );

      mockTemplateServiceClient.getMetas.mockReturnValue(
        of({
          metas: [
            {
              id: 1,
              templateId: 1,
              metaKey: 'test',
              metaValue: 'test',
            },
          ],
        }),
      );
      const mockResponse = {
        status: jest.fn(),
      } as unknown as Response;

      const result = await controller.get(1, undefined, mockResponse, undefined);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(result.data).toBeDefined();
      expect(result.data.id).toEqual(1);
      expect(result.data.metas).toHaveLength(1);
    });
  });

  describe('getPublishedPaged', () => {
    it('should return paged templates', async () => {
      mockTemplateServiceClient.getPaged.mockReturnValue(of({ rows: [], total: 0 }));
      const result = await controller.getPublishedPaged({});
      expect(result.data).toBeDefined();
      expect(result.data.rows).toHaveLength(0);
      expect(result.data.total).toBe(0);
    });
  });

  describe('getPaged', () => {
    it('should return paged templates', async () => {
      mockTemplateServiceClient.getPaged.mockReturnValue(of({ rows: [], total: 0 }));
      const result = await controller.getPaged({});
      expect(result.data).toBeDefined();
      expect(result.data.rows).toHaveLength(0);
      expect(result.data.total).toBe(0);
    });
  });

  describe('create', () => {
    it('should create new template', async () => {
      mockTemplateServiceClient.createPost.mockReturnValue(
        of({
          template: {
            id: 1,
            name: 'test',
            title: 'Test Template',
            author: 1,
            content: 'test content',
            excerpt: '',
            type: 'post',
            order: 0,
            status: 'draft',
            commentStatus: 'open',
            commentCount: 0,
            updatedAt: new Date(),
            createdAt: new Date(),
          },
        }),
      );
      const newTemplate = {
        name: 'test',
        title: 'Test Template',
        content: 'test content',
      };

      const result = await controller.create(newTemplate, { sub: '1' });
      expect(result.data).toBeDefined();
      expect(result.data.name).toBe('test');
      expect(result.data.title).toBe('Test Template');
    });
  });

  describe('update', () => {
    it('should update template successfully', async () => {
      mockTemplateServiceClient.update.mockReturnValue(of({}));
      const updateTemplate = {
        title: 'Updated Test Template',
      };
      const result = await controller.update(1, updateTemplate, { sub: '1' });
      expect(result.success).toBe(true);
    });

    it('should handle update error', async () => {
      mockTemplateServiceClient.update.mockReturnValue(throwError(() => new Error('Update failed')));
      const updateTemplate = {
        title: 'Updated Test Template',
      };
      const result = (await controller.update(1, updateTemplate, { sub: '1' })) as ResponseError;
      expect(result.success).toBe(false);
      expect(result.message).toBe('Update failed');
    });
  });
});
