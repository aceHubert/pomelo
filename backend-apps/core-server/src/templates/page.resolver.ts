import { ModuleRef } from '@nestjs/core';
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { Fields, User, RequestUser } from '@pomelo/shared';
import {
  TemplateDataSource,
  PagedTemplateArgs,
  TemplateOptionArgs,
  Taxonomy,
  TemplateStatus,
  TemplateType,
} from '@pomelo/datasource';
import { ResolveTree } from 'graphql-parse-resolve-info';
import { Anonymous, Authorized } from 'nestjs-authorization';
import { RamAuthorized } from 'nestjs-ram-authorization';
import { PageTemplateAction } from '@/common/actions';
import { createMetaFieldResolver } from '@/common/resolvers/meta.resolver';
import { MessageService } from '@/messages/message.service';
import { NewPageTemplateInput } from './dto/new-template.input';
import { UpdatePageTemplateInput } from './dto/update-template.input';
import { PagedPageTemplateArgs, PageTemplateOptionArgs } from './dto/template.args';
import { PageTemplate, PagedPageTemplate, PageTemplateOption } from './models/page.model';

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
  pageTemplate(
    @Args('id', { type: () => ID, description: 'Page id' }) id: number,
    @Fields() fields: ResolveTree,
    @User() requestUser?: RequestUser,
  ): Promise<PageTemplate | undefined> {
    return this.templateDataSource.get(
      id,
      TemplateType.Page,
      this.getFieldNames(fields.fieldsByTypeName.PageTemplate),
      requestUser,
    );
  }

  @Anonymous()
  @Query((returns) => PageTemplate, { nullable: true, description: 'Get page template by alias name.' })
  pageTemplateByName(
    @Args('name', { type: () => String, description: 'Page name' }) name: string,
    @Fields() fields: ResolveTree,
    @User() requestUser?: RequestUser,
  ): Promise<PageTemplate | undefined> {
    return this.templateDataSource.getByName(
      name,
      TemplateType.Page,
      this.getFieldNames(fields.fieldsByTypeName.PageTemplate),
      requestUser,
    );
  }

  @RamAuthorized(PageTemplateAction.PagedList)
  @Query((returns) => PagedPageTemplate, { description: 'Get paged page templates.' })
  pageTemplates(
    @Args() args: PagedPageTemplateArgs,
    @Fields() fields: ResolveTree,
    @User() requestUser?: RequestUser,
  ): Promise<PagedPageTemplate> {
    const { categoryId, categoryName, ...restArgs } = args;
    return this.templateDataSource.getPaged(
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
  }

  @RamAuthorized(PageTemplateAction.Create)
  @Mutation((returns) => PageTemplate, { description: 'Create a new page template.' })
  async createPageTempate(
    @Args('model', { type: () => NewPageTemplateInput }) model: NewPageTemplateInput,
    @User() requestUser: RequestUser,
  ): Promise<PageTemplate> {
    const { id, name, title, author, content, status, commentStatus, commentCount, updatedAt, createdAt } =
      await this.templateDataSource.create(model, TemplateType.Page, requestUser);

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
      content,
      status,
      commentStatus,
      commentCount,
      updatedAt,
      createdAt,
    };
  }

  @RamAuthorized(PageTemplateAction.Update)
  @Mutation((returns) => Boolean, { description: 'Update page template (must not be in "trash" status).' })
  async updatePageTemplate(
    @Args('id', { type: () => ID, description: 'Page id' }) id: number,
    @Args('model', { type: () => UpdatePageTemplateInput }) model: UpdatePageTemplateInput,
    @User() requestUser: RequestUser,
  ): Promise<boolean> {
    const result = await this.templateDataSource.update(id, model, requestUser);

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
