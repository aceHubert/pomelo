import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '../config/config.module';
import { DataSourceModule } from '../sequelize-datasources/datasource.module';
import { TemplateController } from './template.controller';
// import { TemplateService } from './template.service';

describe('TemplateController', () => {
  let templateController: TemplateController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({}), DataSourceModule],
      controllers: [TemplateController],
      // providers: [TemplateService],
    }).compile();

    templateController = app.get<TemplateController>(TemplateController);
  });

  // describe('getHello', () => {
  //   it('should return "Hello World!"', () => {
  //     expect(templateController.getHello()).toBe('Hello World!');
  //   });
  // });
});
