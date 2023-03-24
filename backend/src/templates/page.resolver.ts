import { ModuleRef } from '@nestjs/core';
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { Taxonomy, Taxonomy as TaxonomyEnum, TemplateStatus, TemplateType } from '@/orm-entities/interfaces';
import { Fields, ResolveTree } from '@/common/decorators/field.decorator';
import { Anonymous, Authorized } from '@/common/decorators/authorized.decorator';
import { RamAuthorized, Actions } from '@/common/decorators/ram-authorized.decorator';
import { User } from '@/common/decorators/user.decorator';
import { createMetaFieldResolver } from '@/common/resolvers/meta.resolver';
import { createTaxonomyFieldResolver } from './base.resolver';

// Types
import { TemplateDataSource, TermTaxonomyDataSource } from '@/sequelize-datasources/datasources';
import { PagedTemplateArgs, TemplateOptionArgs } from '@/sequelize-datasources/interfaces';

import { MessageService } from '@/messages/message.service';
import { NewPageTemplateInput } from './dto/new-template.input';
import { UpdatePageTemplateInput } from './dto/update-template.input';
import { PagedPageTemplateArgs, PageTemplateOptionArgs } from './dto/template.args';
import { PageTemplate, PagedPageTemplateItem, PagedPageTemplate, PageTemplateOption } from './models/page.model';

@Authorized()
@Resolver(() => PagedPageTemplateItem)
export class PagedPageTemplateItemCategoryResolver extends createTaxonomyFieldResolver(PagedPageTemplateItem, {
  propertyName: 'categories',
  taxonomy: TaxonomyEnum.Category,
  description: 'Categories',
  useDataLoader: true,
}) {
  constructor(protected readonly termTaxonomyDataSource: TermTaxonomyDataSource) {
    super(termTaxonomyDataSource);
  }
}

@Resolver(() => PageTemplate)
export class PageTemplateCategoryResolver extends createTaxonomyFieldResolver(PageTemplate, {
  propertyName: 'categories',
  taxonomy: TaxonomyEnum.Category,
  description: 'Categories',
}) {
  constructor(protected readonly termTaxonomyDataSource: TermTaxonomyDataSource) {
    super(termTaxonomyDataSource);
  }
}

@Authorized()
@Resolver(() => PageTemplate)
export class PageTemplateResolver extends createMetaFieldResolver(PageTemplate, TemplateDataSource) {
  constructor(
    protected readonly moduleRef: ModuleRef,
    private readonly templateDataSource: TemplateDataSource,
    private readonly messageService: MessageService,
  ) {
    super(moduleRef);
  }

  @Anonymous()
  @Query((returns) => [String!], { description: ' Get page alias paths' })
  pageAliasPaths(): Promise<string[]> {
    return this.templateDataSource.getNames(TemplateType.Page);
  }

  @Anonymous()
  @Query((returns) => [PageTemplateOption], { nullable: true, description: 'Get page template options.' })
  pageTemplateOptions(
    @Args() args: PageTemplateOptionArgs,
    @Fields() fields: ResolveTree,
  ): Promise<PageTemplateOption[]> {
    const { categoryId, categoryName, ...restArgs } = args;
    return this.templateDataSource.getOptions(
      {
        ...restArgs,
        taxonomies: [
          (categoryId !== void 0 || categoryName !== void 0) && {
            taxonomyType: Taxonomy.Category,
            taxonomyId: categoryId,
            taxonomyName: categoryName,
          },
        ].filter(Boolean) as TemplateOptionArgs['taxonomies'],
      },
      TemplateType.Page,
      this.getFieldNames(fields.fieldsByTypeName.PageTemplateOption),
    );
  }

  @Anonymous()
  @Query((returns) => PageTemplate, { nullable: true, description: 'Get page template.' })
  async pageTemplate(
    @Args('id', { type: () => ID, description: 'Page id' }) id: number,
    @Fields() fields: ResolveTree,
    @User() requestUser?: RequestUser,
  ): Promise<PageTemplate | undefined> {
    const result = await this.templateDataSource.get(
      id,
      TemplateType.Page,
      // content 不在模型里
      ['content', ...this.getFieldNames(fields.fieldsByTypeName.PageTemplate)],
      requestUser,
    );
    if (result) {
      const { content, ...restData } = result;
      return {
        ...restData,
        schema: content,
      };
    }
    return;
  }

  @Anonymous()
  @Query((returns) => PageTemplate, { nullable: true, description: 'Get page template by alias name.' })
  async pageTemplateByName(
    @Args('name', { type: () => String, description: 'Page name' }) name: string,
    @Fields() fields: ResolveTree,
    @User() requestUser?: RequestUser,
  ): Promise<PageTemplate | undefined> {
    const result = await this.templateDataSource.getByName(
      name,
      TemplateType.Page,
      // content 不在模型里
      ['content', ...this.getFieldNames(fields.fieldsByTypeName.PageTemplate)],
      requestUser,
    );
    if (result) {
      const { content, ...restData } = result;
      return {
        ...restData,
        schema: content,
      };
    }
    return;
  }

  @RamAuthorized(Actions.PageTemplate.PagedList)
  @Query((returns) => PagedPageTemplate, { description: 'Get paged page templates.' })
  async pageTemplates(
    @Args() args: PagedPageTemplateArgs,
    @Fields() fields: ResolveTree,
    @User() requestUser?: RequestUser,
  ): Promise<PagedPageTemplate> {
    const { categoryId, categoryName, ...restArgs } = args;
    const { rows, total } = await this.templateDataSource.getPaged(
      {
        ...restArgs,
        taxonomies: [
          (categoryId !== void 0 || categoryName !== void 0) && {
            taxonomyType: Taxonomy.Category,
            taxonomyId: categoryId,
            taxonomyName: categoryName,
          },
        ].filter(Boolean) as PagedTemplateArgs['taxonomies'],
      },
      TemplateType.Page,
      this.getFieldNames(fields.fieldsByTypeName.PagedPageTemplate.rows.fieldsByTypeName.PagedPageTemplateItem),
      requestUser,
    );

    return {
      rows,
      total,
    };
  }

  @RamAuthorized(Actions.PageTemplate.Create)
  @Mutation((returns) => PageTemplate, { description: 'Create a new page template.' })
  async createPageTempate(
    @Args('model', { type: () => NewPageTemplateInput }) model: NewPageTemplateInput,
    @User() requestUser: RequestUser,
  ): Promise<PageTemplate> {
    const { schema, ...restInput } = model;
    const { id, name, title, author, content, status, createdAt } = await this.templateDataSource.create(
      { content: schema, ...restInput },
      TemplateType.Page,
      requestUser,
    );

    // 新建（当状态为需要审核）审核消息推送
    if (status === TemplateStatus.Pending) {
      await this.messageService.publish({
        excludes: [requestUser.sub!],
        message: {
          eventName: 'createPageReview',
          payload: {
            id,
          },
        },
      });
    }

    return {
      id,
      name,
      title,
      author,
      schema: content,
      status,
      createdAt,
    };
  }

  @RamAuthorized(Actions.PageTemplate.Update)
  @Mutation((returns) => Boolean, { description: 'Update page template (must not be in "trash" status).' })
  async updatePageTemplate(
    @Args('id', { type: () => ID, description: 'Page id' }) id: number,
    @Args('model', { type: () => UpdatePageTemplateInput }) model: UpdatePageTemplateInput,
    @User() requestUser: RequestUser,
  ): Promise<boolean> {
    const { schema, ...restInput } = model;
    const result = await this.templateDataSource.update(id, { content: schema, ...restInput }, requestUser);

    // 修改（当状态为需要审核并且有任何修改）审核消息推送
    if (result && model.status === TemplateStatus.Pending) {
      await this.messageService.publish({
        excludes: [requestUser.sub!],
        message: {
          eventName: 'updatePageReview',
          payload: {
            id,
          },
        },
      });
    }

    return result;
  }
}
