import { Inject, OnModuleInit, ParseIntPipe } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
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
  TemplateCommentStatus,
  TemplatePresetType,
  TermPresetTaxonomy,
  POMELO_SERVICE_PACKAGE_NAME,
} from '@ace-pomelo/shared/server';
import {
  TEMPLATE_SERVICE_NAME,
  TemplateServiceClient,
  TemplateModel,
  GetTemplateOptionsRequest,
  GetPagedTemplateRequest,
} from '@ace-pomelo/shared/server/proto-ts/template';
import { OPTION_SERVICE_NAME, OptionServiceClient } from '@ace-pomelo/shared/server/proto-ts/option';
import { TemplateAction, PageTemplateAction } from '@/common/actions';
import { createMetaFieldResolver } from '@/common/resolvers/meta.resolver';
import { WrapperTemplateCommentStatus, WrapperTemplateStatus } from '@/common/utils/wrapper-enum.util';
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
  constructor(@Inject(POMELO_SERVICE_PACKAGE_NAME) client: ClientGrpc) {
    super(client);
  }
}

@Authorized()
@Resolver(() => PageTemplate)
export class PageTemplateAuthorResolver extends createAuthorFieldResolver(PageTemplate) {
  constructor(@Inject(POMELO_SERVICE_PACKAGE_NAME) client: ClientGrpc) {
    super(client);
  }
}

// #endregion

@Authorized()
@Resolver(() => PagedPageTemplateItem)
export class PagedPageTemplateItemMetaFieldResolver
  extends createMetaFieldResolver('template', PagedPageTemplateItem, {
    authDecorator: () => RamAuthorized(TemplateAction.MetaList),
  })
  implements OnModuleInit
{
  private templateServiceClient!: TemplateServiceClient;

  constructor(@Inject(POMELO_SERVICE_PACKAGE_NAME) private readonly client: ClientGrpc) {
    super();
  }

  onModuleInit() {
    this.templateServiceClient = this.client.getService<TemplateServiceClient>(TEMPLATE_SERVICE_NAME);
  }

  get metaServiceClient() {
    return this.templateServiceClient;
  }
}

@Authorized()
@Resolver(() => PageTemplate)
export class PageTemplateResolver extends createMetaFieldResolver('template', PageTemplate, {
  authDecorator: () => RamAuthorized(TemplateAction.MetaList),
}) {
  private templateServiceClient!: TemplateServiceClient;
  private optionServiceClient!: OptionServiceClient;

  constructor(
    @Inject(POMELO_SERVICE_PACKAGE_NAME) private readonly client: ClientGrpc,
    private readonly messageService: MessageService,
  ) {
    super();
  }

  onModuleInit() {
    this.templateServiceClient = this.client.getService<TemplateServiceClient>(TEMPLATE_SERVICE_NAME);
    this.optionServiceClient = this.client.getService<OptionServiceClient>(OPTION_SERVICE_NAME);
  }

  get metaServiceClient() {
    return this.templateServiceClient;
  }

  private mapToPageTemplate(model: TemplateModel): PageTemplate {
    return {
      ...model,
      status: WrapperTemplateStatus.asValueOrDefault(model.status, TemplateStatus.Publish),
      commentStatus: WrapperTemplateCommentStatus.asValueOrDefault(model.commentStatus, TemplateCommentStatus.Open),
    };
  }

  @Anonymous()
  @Query((returns) => [String!], { description: ' Get page alias paths' })
  pageAliasPaths(): Promise<string[]> {
    return this.templateServiceClient
      .getNames({ type: TemplatePresetType.Page })
      .lastValue()
      .then(({ names }) => names);
  }

  @Anonymous()
  @Query((returns) => [PageTemplateOption], { nullable: true, description: 'Get page template options.' })
  async pageTemplateOptions(
    @Args() args: PageTemplateOptionArgs,
    @Fields() fields: ResolveTree,
  ): Promise<PageTemplateOption[]> {
    const { categoryId, categoryName, ...restArgs } = args;
    const { options } = await this.templateServiceClient
      .getOptions({
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
        ].filter(Boolean) as GetTemplateOptionsRequest['taxonomies'],
        type: TemplatePresetType.Page,
        fields: this.getFieldNames(fields.fieldsByTypeName.PageTemplateOption),
      })
      .lastValue();

    return options;
  }

  @Anonymous()
  @Query((returns) => PageTemplate, { nullable: true, description: 'Get page template.' })
  async pageTemplate(
    @Args('id', { type: () => ID, description: 'Page id' }, ParseIntPipe) id: number,
    @Fields() fields: ResolveTree,
    @User() requestUser?: RequestUser,
  ): Promise<PageTemplate | undefined> {
    const { template } = await this.templateServiceClient
      .get({
        id,
        type: TemplatePresetType.Page,
        fields: this.getFieldNames(fields.fieldsByTypeName.PageTemplate),
        requestUserId: requestUser ? Number(requestUser.sub) : undefined,
      })
      .lastValue();

    return template ? this.mapToPageTemplate(template) : undefined;
  }

  @Anonymous()
  @Query((returns) => PageTemplate, { nullable: true, description: 'Get page template by alias name.' })
  async pageTemplateByName(
    @Args('name', {
      type: () => String,
      nullable: true,
      description: 'Page alias name, if not setted, will get the page template which is setted as "page on front".',
    })
    name: string | undefined,
    @Fields() fields: ResolveTree,
    @User() requestUser?: RequestUser,
  ): Promise<PageTemplate | undefined> {
    const { template } = name
      ? await this.templateServiceClient
          .getByName({
            name,
            type: TemplatePresetType.Page,
            fields: this.getFieldNames(fields.fieldsByTypeName.PageTemplate),
            requestUserId: requestUser ? Number(requestUser.sub) : undefined,
          })
          .lastValue()
      : await this.optionServiceClient
          .getValue({
            optionName: OptionPresetKeys.PageOnFront,
          })
          .lastValue()
          .then(({ optionValue: id }) => {
            if (id) {
              return this.templateServiceClient
                .get({
                  id: Number(id),
                  type: TemplatePresetType.Page,
                  fields: this.getFieldNames(fields.fieldsByTypeName.PageTemplate),
                  requestUserId: requestUser ? Number(requestUser.sub) : undefined,
                })
                .lastValue();
            }
            return { template: undefined };
          });

    return template ? this.mapToPageTemplate(template) : undefined;
  }

  @Query((returns) => PagedPageTemplate, { description: 'Get paged page templates.' })
  async pageTemplates(
    @Args() args: PagedPageTemplateArgs,
    @Fields() fields: ResolveTree,
    @User() requestUser?: RequestUser,
  ): Promise<PagedPageTemplate> {
    const { categoryId, categoryName, ...restArgs } = args;
    return this.templateServiceClient
      .getPaged({
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
        ].filter(Boolean) as GetPagedTemplateRequest['taxonomies'],
        type: TemplatePresetType.Page,
        fields: this.getFieldNames(
          fields.fieldsByTypeName.PagedPageTemplate.rows.fieldsByTypeName.PagedPageTemplateItem,
        ),
        requestUserId: requestUser ? Number(requestUser.sub) : undefined,
      })
      .lastValue()
      .then(({ rows, ...rest }) => ({
        ...rest,
        rows: rows.map((row) => this.mapToPageTemplate(row)),
      }));
  }

  @RamAuthorized(PageTemplateAction.Create)
  @Mutation((returns) => PageTemplate, { description: 'Create a new page template.' })
  async createPageTemplate(
    @Args('model', { type: () => NewPageTemplateInput }) model: NewPageTemplateInput,
    @User() requestUser: RequestUser,
  ): Promise<PageTemplate> {
    const { template } = await this.templateServiceClient
      .createPage({
        ...model,
        metas: model.metas || [],
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();

    // 新建（当状态为需要审核）审核消息推送
    if (template.status === TemplateStatus.Pending) {
      await this.messageService.publish(
        {
          eventName: 'createPageReview',
          payload: {
            id: template.id,
          },
        },
        { excludes: [requestUser.sub] },
      );
    }

    return this.mapToPageTemplate(template);
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
    await this.templateServiceClient
      .update({
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
