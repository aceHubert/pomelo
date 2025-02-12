import { Inject, ParseIntPipe } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ResolveTree } from 'graphql-parse-resolve-info';
import { VoidResolver } from 'graphql-scalars';
import { Anonymous, Authorized } from '@ace-pomelo/nestjs-authorization';
import { RamAuthorized } from '@ace-pomelo/nestjs-ram-authorization';
import {
  Fields,
  User,
  RequestUser,
  OptionPresetKeys,
  TemplateStatus,
  TemplatePresetType,
  TermPresetTaxonomy,
  INFRASTRUCTURE_SERVICE,
  OptionPattern,
  TemplatePattern,
} from '@ace-pomelo/shared/server';
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
  constructor(@Inject(INFRASTRUCTURE_SERVICE) protected readonly basicService: ClientProxy) {
    super(basicService);
  }
}

@Authorized()
@Resolver(() => PageTemplate)
export class PageTemplateAuthorResolver extends createAuthorFieldResolver(PageTemplate) {
  constructor(@Inject(INFRASTRUCTURE_SERVICE) protected readonly basicService: ClientProxy) {
    super(basicService);
  }
}

// #endregion

@Authorized()
@Resolver(() => PagedPageTemplateItem)
export class PagedPageTemplateItemMetaFieldResolver extends createMetaFieldResolver(PagedPageTemplateItem, {
  modelName: 'template',
  authDecorator: () => RamAuthorized(TemplateAction.MetaList),
}) {
  constructor(@Inject(INFRASTRUCTURE_SERVICE) protected readonly basicService: ClientProxy) {
    super(basicService);
  }
}

@Authorized()
@Resolver(() => PageTemplate)
export class PageTemplateResolver extends createMetaFieldResolver(PageTemplate, {
  modelName: 'template',
  authDecorator: () => RamAuthorized(TemplateAction.MetaList),
}) {
  constructor(
    @Inject(INFRASTRUCTURE_SERVICE) protected readonly basicService: ClientProxy,
    private readonly messageService: MessageService,
  ) {
    super(basicService);
  }

  @Anonymous()
  @Query((returns) => [String!], { description: ' Get page alias paths' })
  pageAliasPaths(): Promise<string[]> {
    return this.basicService.send<string[]>(TemplatePattern.GetNames, { type: TemplatePresetType.Page }).lastValue();
  }

  @Anonymous()
  @Query((returns) => [PageTemplateOption], { nullable: true, description: 'Get page template options.' })
  pageTemplateOptions(
    @Args() args: PageTemplateOptionArgs,
    @Fields() fields: ResolveTree,
  ): Promise<PageTemplateOption[]> {
    const { categoryId, categoryName, ...restArgs } = args;
    return this.basicService
      .send<PageTemplateOption[]>(TemplatePattern.GetOptions, {
        query: {
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
          ].filter(Boolean),
        },
        type: TemplatePresetType.Page,
        fields: this.getFieldNames(fields.fieldsByTypeName.PageTemplateOption),
      })
      .lastValue();
  }

  @Anonymous()
  @Query((returns) => PageTemplate, { nullable: true, description: 'Get page template.' })
  pageTemplate(
    @Args('id', { type: () => ID, description: 'Page id' }, ParseIntPipe) id: number,
    @Fields() fields: ResolveTree,
    @User() requestUser?: RequestUser,
  ): Promise<PageTemplate | undefined> {
    return this.basicService
      .send<PageTemplate | undefined>(TemplatePattern.Get, {
        id,
        type: TemplatePresetType.Page,
        fields: this.getFieldNames(fields.fieldsByTypeName.PageTemplate),
        requestUserId: requestUser ? Number(requestUser.sub) : undefined,
      })
      .lastValue();
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
      return this.basicService
        .send<PageTemplate>(TemplatePattern.GetByName, {
          name,
          type: TemplatePresetType.Page,
          fields: this.getFieldNames(fields.fieldsByTypeName.PageTemplate),
          requestUserId: requestUser ? Number(requestUser.sub) : undefined,
        })
        .lastValue();
    } else {
      return this.basicService
        .send<string | undefined>(OptionPattern.GetValue, {
          optionName: OptionPresetKeys.PageOnFront,
        })
        .lastValue()
        .then((id) => {
          if (id) {
            return this.basicService
              .send<PageTemplate>(TemplatePattern.Get, {
                id: Number(id),
                type: TemplatePresetType.Page,
                fields: this.getFieldNames(fields.fieldsByTypeName.PageTemplate),
                requestUserId: requestUser ? Number(requestUser.sub) : undefined,
              })
              .lastValue();
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
    return this.basicService
      .send<PagedPageTemplate>(TemplatePattern.GetPaged, {
        query: {
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
          ].filter(Boolean),
        },
        type: TemplatePresetType.Page,
        fields: this.getFieldNames(
          fields.fieldsByTypeName.PagedPageTemplate.rows.fieldsByTypeName.PagedPageTemplateItem,
        ),
        requestUserId: requestUser ? Number(requestUser.sub) : undefined,
      })
      .lastValue();
  }

  @RamAuthorized(PageTemplateAction.Create)
  @Mutation((returns) => PageTemplate, { description: 'Create a new page template.' })
  async createPageTempate(
    @Args('model', { type: () => NewPageTemplateInput }) model: NewPageTemplateInput,
    @User() requestUser: RequestUser,
  ): Promise<PageTemplate> {
    const { id, name, title, author, content, status, commentStatus, commentCount, updatedAt, createdAt } =
      await this.basicService
        .send<PageTemplate>(TemplatePattern.CreatePage, {
          ...model,
          requestUserId: Number(requestUser.sub),
        })
        .lastValue();

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
    @Args('id', { type: () => ID, description: 'Page id' }, ParseIntPipe) id: number,
    @Args('model', { type: () => UpdatePageTemplateInput }) model: UpdatePageTemplateInput,
    @User() requestUser: RequestUser,
  ): Promise<void> {
    await this.basicService
      .send<void>(TemplatePattern.UpdatePage, {
        ...model,
        id,
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();

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
