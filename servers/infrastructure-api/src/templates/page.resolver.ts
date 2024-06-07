import { ModuleRef } from '@nestjs/core';
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ResolveTree } from 'graphql-parse-resolve-info';
import { VoidResolver } from 'graphql-scalars';
import { Anonymous, Authorized } from '@ace-pomelo/nestjs-oidc';
import { RamAuthorized } from '@ace-pomelo/ram-authorization';
import { Fields, User, RequestUser } from '@ace-pomelo/shared-server';
import {
  OptionDataSource,
  OptionPresetKeys,
  TemplateDataSource,
  UserDataSource,
  PagedTemplateArgs,
  TemplateOptionArgs,
  TemplateStatus,
  TemplatePresetType,
  TermPresetTaxonomy,
} from '@ace-pomelo/infrastructure-datasource';
import { TemplateAction, PageTemplateAction } from '@/common/actions';
import { createMetaFieldResolver } from '@/common/resolvers/meta.resolver';
import { MessageService } from '@/messages/message.service';
import { createAuthorFieldResolver } from './base.resolver';
import { NewPageTemplateInput } from './dto/new-template.input';
import { UpdatePageTemplateInput } from './dto/update-template.input';
import { PagedPageTemplateArgs, PageTemplateOptionArgs } from './dto/template.args';
import { PageTemplate, PagedPageTemplate, PageTemplateOption, PagedPageTemplateItem } from './models/page.model';

// #region Author Resolver

@Authorized()
@Resolver(() => PagedPageTemplateItem)
export class PagedPageTemplateItemAuthorResolver extends createAuthorFieldResolver(PagedPageTemplateItem, true) {
  constructor(protected readonly userDataSource: UserDataSource) {
    super(userDataSource);
  }
}

@Authorized()
@Resolver(() => PageTemplate)
export class PageTemplateAuthorResolver extends createAuthorFieldResolver(PageTemplate) {
  constructor(protected readonly userDataSource: UserDataSource) {
    super(userDataSource);
  }
}

// #endregion

@Authorized()
@Resolver(() => PagedPageTemplateItem)
export class PagedPageTemplateItemMetaFieldResolver extends createMetaFieldResolver(
  PagedPageTemplateItem,
  TemplateDataSource,
  {
    authDecorator: () => RamAuthorized(TemplateAction.MetaList),
  },
) {}

@Authorized()
@Resolver(() => PageTemplate)
export class PageTemplateResolver extends createMetaFieldResolver(PageTemplate, TemplateDataSource, {
  authDecorator: () => RamAuthorized(TemplateAction.MetaList),
}) {
  constructor(
    protected readonly moduleRef: ModuleRef,
    private readonly optionDataSource: OptionDataSource,
    private readonly templateDataSource: TemplateDataSource,
    private readonly messageService: MessageService,
  ) {
    super(moduleRef);
  }

  @Anonymous()
  @Query((returns) => [String!], { description: ' Get page alias paths' })
  pageAliasPaths(): Promise<string[]> {
    return this.templateDataSource.getNames(TemplatePresetType.Page);
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
          categoryId !== void 0
            ? {
                type: TermPresetTaxonomy.Category,
                id: categoryId,
              }
            : categoryName !== void 0
            ? {
                type: TermPresetTaxonomy.Category,
                name: categoryName,
              }
            : false,
        ].filter(Boolean) as TemplateOptionArgs['taxonomies'],
      },
      TemplatePresetType.Page,
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
      TemplatePresetType.Page,
      this.getFieldNames(fields.fieldsByTypeName.PageTemplate),
      requestUser ? Number(requestUser.sub) : undefined,
    );
  }

  @Anonymous()
  @Query((returns) => PageTemplate, { nullable: true, description: 'Get page template by alias name.' })
  pageTemplateByName(
    @Args('name', {
      type: () => String,
      nullable: true,
      description: 'Page alias name, if not setted, will get the page template which is setted as "page on front".',
    })
    name: string | undefined,
    @Fields() fields: ResolveTree,
    @User() requestUser?: RequestUser,
  ): Promise<PageTemplate | undefined> {
    if (name) {
      return this.templateDataSource.getByName(
        name,
        TemplatePresetType.Page,
        this.getFieldNames(fields.fieldsByTypeName.PageTemplate),
        requestUser ? Number(requestUser.sub) : undefined,
      );
    } else {
      return this.optionDataSource.getValue(OptionPresetKeys.PageOnFront).then((id) => {
        if (id) {
          return this.templateDataSource.get(
            Number(id),
            TemplatePresetType.Page,
            this.getFieldNames(fields.fieldsByTypeName.PageTemplate),
            requestUser ? Number(requestUser.sub) : undefined,
          );
        }
        return undefined;
      });
    }
  }

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
          categoryId !== void 0
            ? {
                type: TermPresetTaxonomy.Category,
                id: categoryId,
              }
            : categoryName !== void 0
            ? {
                type: TermPresetTaxonomy.Category,
                name: categoryName,
              }
            : false,
        ].filter(Boolean) as PagedTemplateArgs['taxonomies'],
      },
      TemplatePresetType.Page,
      this.getFieldNames(fields.fieldsByTypeName.PagedPageTemplate.rows.fieldsByTypeName.PagedPageTemplateItem),
      requestUser ? Number(requestUser.sub) : undefined,
    );
  }

  @RamAuthorized(PageTemplateAction.Create)
  @Mutation((returns) => PageTemplate, { description: 'Create a new page template.' })
  async createPageTempate(
    @Args('model', { type: () => NewPageTemplateInput }) model: NewPageTemplateInput,
    @User() requestUser: RequestUser,
  ): Promise<PageTemplate> {
    const { id, name, title, author, content, status, commentStatus, commentCount, updatedAt, createdAt } =
      await this.templateDataSource.create(model, TemplatePresetType.Page, Number(requestUser.sub));

    // 新建（当状态为需要审核）审核消息推送
    if (status === TemplateStatus.Pending) {
      await this.messageService.publish(
        {
          eventName: 'createPageReview',
          payload: {
            id,
          },
        },
        { excludes: [requestUser.sub] },
      );
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
  @Mutation((returns) => VoidResolver, {
    nullable: true,
    description: 'Update page template (must not be in "trash" status).',
  })
  async updatePageTemplate(
    @Args('id', { type: () => ID, description: 'Page id' }) id: number,
    @Args('model', { type: () => UpdatePageTemplateInput }) model: UpdatePageTemplateInput,
    @User() requestUser: RequestUser,
  ): Promise<void> {
    await this.templateDataSource.update(id, model, Number(requestUser.sub));

    // 修改（当状态为需要审核并且有任何修改）审核消息推送
    if (model.status === TemplateStatus.Pending) {
      await this.messageService.publish(
        {
          eventName: 'updatePageReview',
          payload: {
            id,
          },
        },
        { excludes: [requestUser.sub] },
      );
    }
  }
}
