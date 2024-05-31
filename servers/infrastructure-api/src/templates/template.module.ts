import { Module } from '@nestjs/common';
import { TemplateController } from './base.controller';
import { TemplateResolver, PagedTemplateItemCategoryResolver, TemplateCategoryResolver } from './base.resolver';
import { PostTemplateController } from './post.controller';
import {
  PostTemplateResolver,
  PagedPostTemplateItemTaxonomyFieldResolver,
  PagedPostTemplateItemMetaFieldResolver,
} from './post.resolver';
import { FormTemplateController } from './form.controller';
import { FormTemplateResolver, PagedFormTemplateItemMetaFieldResolver } from './form.resolver';
import { PageTemplateController } from './page.controller';
import { PageTemplateResolver, PagedPageTemplateItemMetaFieldResolver } from './page.resolver';

import './enums/registered.enum';

@Module({
  controllers: [TemplateController, FormTemplateController, PageTemplateController, PostTemplateController],
  providers: [
    TemplateResolver,
    PagedTemplateItemCategoryResolver,
    TemplateCategoryResolver,
    PostTemplateResolver,
    PagedPostTemplateItemMetaFieldResolver,
    PagedPostTemplateItemTaxonomyFieldResolver,
    FormTemplateResolver,
    PagedFormTemplateItemMetaFieldResolver,
    PageTemplateResolver,
    PagedPageTemplateItemMetaFieldResolver,
  ],
})
export class TemplateModule {}
