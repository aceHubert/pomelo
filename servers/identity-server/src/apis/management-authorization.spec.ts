import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthorizationModule, AuthorizationService, getSigningKey, getVerifyingKey } from '@ace-nestjs/authorization';
import { RamAuthorizationModule } from '@ace-nestjs/ram-authorization';
import { ClientDataSource } from '@/datasource';
import { ClientController } from './clients/client.controller';

describe('management REST authorization', () => {
  let app: INestApplication;
  let authorizationService: AuthorizationService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        AuthorizationModule.forRoot({
          signingKey: await getSigningKey(),
          verifyingKey: await getVerifyingKey(),
        }),
        RamAuthorizationModule.forRoot({
          serviceName: 'identity',
        }),
      ],
      controllers: [ClientController],
      providers: [
        {
          provide: ClientDataSource,
          useValue: {
            getPaged: jest.fn().mockResolvedValue({ rows: [], total: 0 }),
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    authorizationService = app.get(AuthorizationService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('有效管理 JWT 可以访问代表性管理接口', async () => {
    const token = await authorizationService.createToken(
      {
        sub: '1',
        role: 'administrator',
        ram: {
          PolicyName: 'IdentityManagementFullAccess',
          Statements: [{ Effect: 'Allow', Action: ['identity:*'], Resource: ['*'] }],
        },
      },
      { expiresIn: '1h' },
    );

    await request(app.getHttpServer())
      .get('/v0/management/clients')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect({ rows: [], total: 0 });
  });

  it('缺少 JWT 时拒绝访问代表性管理接口', async () => {
    await request(app.getHttpServer()).get('/v0/management/clients').expect(401);
  });

  it('缺少 RAM 策略时拒绝访问代表性管理接口', async () => {
    const token = await authorizationService.createToken(
      {
        sub: '1',
        role: 'administrator',
      },
      { expiresIn: '1h' },
    );

    await request(app.getHttpServer())
      .get('/v0/management/clients')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });
});
