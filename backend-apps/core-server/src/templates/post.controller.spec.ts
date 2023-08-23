import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { DataSourceModule } from '../sequelize-datasources/datasource.module';
import { PostTemplateController } from './post.controller';
// import { TemplateService } from './template.service';

describe('TemplateController', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let postTemplateController: PostTemplateController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({}), DataSourceModule],
      controllers: [PostTemplateController],
      // providers: [TemplateService],
    }).compile();

    postTemplateController = app.get<PostTemplateController>(PostTemplateController);
  });

  // describe('getHello', () => {
  //   it('should return "Hello World!"', () => {
  //     expect(templateController.getHello()).toBe('Hello World!');
  //   });
  // });
});
