import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { TokenGuard } from '@ace-nestjs/authorization';
import { TokenGuard as RamTokenGuard } from '@ace-nestjs/ram-authorization';
import { INFRASTRUCTURE_SERVICE } from '@ace-pomelo/shared/server';
import '@/common/extends/observable.extend';
import { PostTemplateController } from './post.controller';
// import { TemplateService } from './template.service';

describe('TemplateController', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let postTemplateController: PostTemplateController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [PostTemplateController],
      providers: [
        {
          provide: INFRASTRUCTURE_SERVICE,
          useValue: {
            send: jest.fn(() => of([])),
          },
        },
      ],
    })
      .overrideGuard(TokenGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RamTokenGuard)
      .useValue({ canActivate: () => true })
      .compile();

    postTemplateController = await app.resolve<PostTemplateController>(PostTemplateController);
  });

  describe('getHello', () => {
    it('should return empty options', async () => {
      await expect(postTemplateController.getOptions({} as any)).resolves.toEqual({
        success: true,
        data: [],
      });
    });
  });
});
