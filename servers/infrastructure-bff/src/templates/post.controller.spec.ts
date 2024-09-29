import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { INFRASTRUCTURE_SERVICE } from '@ace-pomelo/shared/server';
import { PostTemplateController } from './post.controller';
// import { TemplateService } from './template.service';

describe('TemplateController', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let postTemplateController: PostTemplateController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({}),
        ClientsModule.registerAsync({
          isGlobal: true,
          clients: [
            {
              name: INFRASTRUCTURE_SERVICE,
              useFactory: () => ({
                transport: Transport.TCP,
                options: {
                  host: 'localhost',
                  port: 5002,
                },
              }),
            },
          ],
        }),
      ],
      controllers: [PostTemplateController],
      // providers: [TemplateService],
    }).compile();

    postTemplateController = app.get<PostTemplateController>(PostTemplateController);
  });

  describe('getHello', () => {
    it('should return "Hello World!"', () => {
      expect(postTemplateController.getOptions({})).toHaveLength(0);
    });
  });
});
