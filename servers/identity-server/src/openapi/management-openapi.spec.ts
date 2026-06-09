import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AuthorizationModule } from '@ace-nestjs/authorization';
import { RamAuthorizationModule } from '@ace-nestjs/ram-authorization';
import { ManagementAccountController } from './account/account.controller';
import { ManagementAccountService } from './account/account.service';
import { ManagementClientController } from './clients/client.controller';
import { ManagementApiResourceController } from './api-resources/api-resource.controller';
import { ManagementIdentityResourceController } from './identity-resources/identity-resource.controller';
import { ClientDataSource, ApiResourceDataSource, IdentityResourceDataSource } from '@/datasource';

describe('management OpenAPI document', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        AuthorizationModule.forRoot({ disableMiddleware: true }),
        RamAuthorizationModule.forRoot({ serviceName: 'identity' }),
      ],
      controllers: [
        ManagementAccountController,
        ManagementClientController,
        ManagementApiResourceController,
        ManagementIdentityResourceController,
      ],
      providers: [
        { provide: ManagementAccountService, useValue: { login: jest.fn(), getCurrentUser: jest.fn() } },
        { provide: ClientDataSource, useValue: {} },
        { provide: ApiResourceDataSource, useValue: {} },
        { provide: IdentityResourceDataSource, useValue: {} },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('所有新增管理 REST 路径均以 /v0/management 开头', () => {
    const document = SwaggerModule.createDocument(app, new DocumentBuilder().setTitle('test').addBearerAuth().build());
    const paths = Object.keys(document.paths).filter((path) => path.includes('management'));

    expect(paths).toContain('/v0/management/auth/login');
    expect(paths).toContain('/v0/management/clients');
    expect(paths).toContain('/v0/management/api-resources');
    expect(paths).toContain('/v0/management/identity-resources');
    expect(paths.every((path) => path.startsWith('/v0/management'))).toBe(true);
  });

  it('受保护管理接口声明 Bearer，登录接口不要求 Bearer', () => {
    const document = SwaggerModule.createDocument(app, new DocumentBuilder().setTitle('test').addBearerAuth().build());

    expect(document.paths['/v0/management/auth/login'].post!.security).toBeUndefined();
    expect(document.paths['/v0/management/clients'].get!.security).toEqual([{ bearer: [] }]);
    expect(document.paths['/v0/management/api-resources'].get!.security).toEqual([{ bearer: [] }]);
    expect(document.paths['/v0/management/identity-resources'].get!.security).toEqual([{ bearer: [] }]);
  });
});
