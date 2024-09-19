import { Module } from '@nestjs/common';
import { TemplateController } from './base.controller';
import {
  TemplateResolver,
  PagedTemplateItemCategoryResolver,
  TemplateCategoryResolver,
  PagedTemplateItemAuthorResolver,
  TemplateAuthorResolver,
} from './base.resolver';
import { PostTemplateController } from './post.controller';
import {
  PostTemplateResolver,
  PagedPostTemplateItemMetaFieldResolver,
  PagedPostTemplateItemTaxonomyFieldResolver,
  PagedPostTemplateItemAuthorResolver,
  PostTemplateAuthorResolver,
} from './post.resolver';
import { PageTemplateController } from './page.controller';
import {
  PageTemplateResolver,
  PagedPageTemplateItemMetaFieldResolver,
  PagedPageTemplateItemAuthorResolver,
  PageTemplateAuthorResolver,
} from './page.resolver';
import { FormTemplateController } from './form.controller';
import {
  FormTemplateResolver,
  PagedFormTemplateItemMetaFieldResolver,
  PagedFormTemplateItemAuthorResolver,
  FormTemplateAuthorResolver,
} from './form.resolver';

import './enums/registered.enum';

@Module({
  controllers: [TemplateController, FormTemplateController, PageTemplateController, PostTemplateController],
  providers: [
    TemplateResolver,
    PagedTemplateItemCategoryResolver,
    TemplateCategoryResolver,
    PagedTemplateItemAuthorResolver,
    TemplateAuthorResolver,
    PostTemplateResolver,
    PagedPostTemplateItemMetaFieldResolver,
    PagedPostTemplateItemTaxonomyFieldResolver,
    PagedPostTemplateItemAuthorResolver,
    PostTemplateAuthorResolver,
    PageTemplateResolver,
    PagedPageTemplateItemMetaFieldResolver,
    PagedPageTemplateItemAuthorResolver,
    PageTemplateAuthorResolver,
    FormTemplateResolver,
    PagedFormTemplateItemMetaFieldResolver,
    PagedFormTemplateItemAuthorResolver,
    FormTemplateAuthorResolver,
  ],
})
export class TemplateModule {}
