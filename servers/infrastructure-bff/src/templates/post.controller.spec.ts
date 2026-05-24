import { of } from 'rxjs';
import '../common/extends/observable.extend';
import { PostTemplateController } from './post.controller';

describe('TemplateController', () => {
  let postTemplateController: PostTemplateController;

  beforeEach(() => {
    postTemplateController = new PostTemplateController({
      send: jest.fn(() => of([])),
    } as any);
  });

  describe('getHello', () => {
    it('should return empty options', async () => {
      await expect(postTemplateController.getOptions({})).resolves.toEqual({
        data: [],
        success: true,
      });
    });
  });
});
