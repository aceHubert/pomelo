import { Module } from '@nestjs/common';
import { TemplateController } from './base.controller';
import { TemplateResolver, PagedTemplateItemCategoryResolver, TemplateCategoryResolver } from './base.resolver';
import { FormTemplateController } from './form.controller';
import {
  FormTemplateResolver,
  PagedFormTemplateItemCategoryResolver,
  FormTemplateCategoryResolver,
} from './form.resolver';
import { PageTemplateController } from './page.controller';
import {
  PageTemplateResolver,
  PagedPageTemplateItemCategoryResolver,
  PageTemplateCategoryResolver,
} from './page.resolver';
import { PostTemplateController } from './post.controller';
import { PostTemplateResolver, PagedPostTemplateItemTaxonomyFieldResolver } from './post.resolver';
import './enums/registered.enum';

@Module({
  controllers: [TemplateController, FormTemplateController, PageTemplateController, PostTemplateController],
  providers: [
    TemplateResolver,
    PagedTemplateItemCategoryResolver,
    TemplateCategoryResolver,
    FormTemplateResolver,
    PagedFormTemplateItemCategoryResolver,
    FormTemplateCategoryResolver,
    PageTemplateResolver,
    PagedPageTemplateItemCategoryResolver,
    PageTemplateCategoryResolver,
    PostTemplateResolver,
    PagedPostTemplateItemTaxonomyFieldResolver,
  ],
})
export class TemplateModule {}
