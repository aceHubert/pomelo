import { Inject, ParseIntPipe, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Resolver, ResolveField, Parent, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ResolveTree } from 'graphql-parse-resolve-info';
import { VoidResolver } from 'graphql-scalars';
import { Anonymous, Authorized } from '@ace-pomelo/nestjs-authorization';
import { RamAuthorized } from '@ace-pomelo/nestjs-ram-authorization';
import {
  Fields,
  User,
  RequestUser,
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
import {
  TERM_TAXONOMY_SERVICE_NAME,
  TermTaxonomyServiceClient,
} from '@ace-pomelo/shared/server/proto-ts/term-taxonomy';
import { TemplateAction, PostTemplateAction } from '@/common/actions';
import { createMetaFieldResolver } from '@/common/resolvers/meta.resolver';
import { WrapperTemplateCommentStatus, WrapperTemplateStatus } from '@/common/utils/wrapper-enum.util';
import { MessageService } from '@/messages/message.service';
import { TermTaxonomy } from '../term-taxonomy/models/term-taxonomy.model';
import { TaxonomyFieldResolver, createAuthorFieldResolver } from './base.resolver';
import { NewPostTemplateInput } from './dto/new-template.input';
import { UpdatePostTemplateInput } from './dto/update-template.input';
import { PagedPostTemplateArgs, ClientPagedPostTemplateArgs, PostTemplateOptionArgs } from './dto/template.args';
import { PostTemplate, PagedPostTemplateItem, PagedPostTemplate, PostTemplateOption } from './models/post.model';

// #region Taxonomy Resolver

@Authorized()
@Resolver(() => PagedPostTemplateItem)
export class PagedPostTemplateItemTaxonomyFieldResolver extends TaxonomyFieldResolver {
  private categoryDataLoader;
  private tagDataLoader;

  constructor(@Inject(POMELO_SERVICE_PACKAGE_NAME) client: ClientGrpc) {
    super(client);
    this.categoryDataLoader = this.createDataLoader(TermPresetTaxonomy.Category);
    this.tagDataLoader = this.createDataLoader(TermPresetTaxonomy.Tag);
  }

  @ResolveField('categories', (returns) => [TermTaxonomy!], {
    description: 'Categories',
  })
  getCategories(@Parent() { id: objectId }: { id: number }, @Fields() fields: ResolveTree): Promise<TermTaxonomy[]> {
    return this.categoryDataLoader.load({
      objectId,
      fields: this.getFieldNames(fields.fieldsByTypeName.TermTaxonomy),
    });
  }

  @ResolveField('tags', (returns) => [TermTaxonomy!], {
    description: 'Tags',
  })
  getTags(@Parent() { id: objectId }: { id: number }, @Fields() fields: ResolveTree): Promise<TermTaxonomy[]> {
    return this.tagDataLoader.load({
      objectId,
      fields: this.getFieldNames(fields.fieldsByTypeName.TermTaxonomy),
    });
  }
}

// #endregion

// #region Author Resolver

@Authorized()
@Resolver(() => PagedPostTemplateItem)
export class PagedPostTemplateItemAuthorResolver extends createAuthorFieldResolver(PagedPostTemplateItem, true) {
  constructor(@Inject(POMELO_SERVICE_PACKAGE_NAME) client: ClientGrpc) {
    super(client);
  }
}

@Authorized()
@Resolver(() => PostTemplate)
export class PostTemplateAuthorResolver extends createAuthorFieldResolver(PostTemplate) {
  constructor(@Inject(POMELO_SERVICE_PACKAGE_NAME) client: ClientGrpc) {
    super(client);
  }
}

// #endregion

@Authorized()
@Resolver(() => PagedPostTemplateItem)
export class PagedPostTemplateItemMetaFieldResolver
  extends createMetaFieldResolver('template', PagedPostTemplateItem, {
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
@Resolver(() => PostTemplate)
export class PostTemplateResolver extends createMetaFieldResolver('template', PostTemplate, {
  authDecorator: () => RamAuthorized(TemplateAction.MetaList),
}) {
  private templateServiceClient!: TemplateServiceClient;
  private termTaxonomyServiceClient!: TermTaxonomyServiceClient;

  constructor(
    @Inject(POMELO_SERVICE_PACKAGE_NAME) private readonly client: ClientGrpc,
    private readonly messageService: MessageService,
  ) {
    super();
  }

  onModuleInit() {
    this.templateServiceClient = this.client.getService<TemplateServiceClient>(TEMPLATE_SERVICE_NAME);
    this.termTaxonomyServiceClient = this.client.getService<TermTaxonomyServiceClient>(TERM_TAXONOMY_SERVICE_NAME);
  }

  get metaServiceClient() {
    return this.templateServiceClient;
  }

  private mapToPostTemplate(model: TemplateModel): PostTemplate {
    return {
      ...model,
      status: WrapperTemplateStatus.asValueOrDefault(model.status, TemplateStatus.Publish),
      commentStatus: WrapperTemplateCommentStatus.asValueOrDefault(model.commentStatus, TemplateCommentStatus.Open),
    };
  }

  @Anonymous()
  @Query((returns) => [PostTemplateOption], { nullable: true, description: 'Get post template options.' })
  async postTemplateOptions(
    @Args() args: PostTemplateOptionArgs,
    @Fields() fields: ResolveTree,
  ): Promise<PostTemplateOption[]> {
    const { categoryId, categoryName, tagId, tagName, ...restArgs } = args;
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
          tagId !== void 0
            ? {
                type: TermPresetTaxonomy.Tag,
                id: tagId,
              }
            : tagName !== void 0
            ? {
                type: TermPresetTaxonomy.Tag,
                name: tagName,
              }
            : false,
        ].filter(Boolean) as GetTemplateOptionsRequest['taxonomies'],
        type: TemplatePresetType.Post,
        fields: this.getFieldNames(fields.fieldsByTypeName.PostTemplateOption),
      })
      .lastValue();

    return options;
  }

  @Anonymous()
  @Query((returns) => PostTemplate, { nullable: true, description: 'Get post template.' })
  async postTemplate(
    @Args('id', { type: () => ID, description: 'Post id' }, ParseIntPipe) id: number,
    @Fields() fields: ResolveTree,
    @User() requestUser?: RequestUser,
  ): Promise<PostTemplate | undefined> {
    const { template } = await this.templateServiceClient
      .get({
        id,
        type: TemplatePresetType.Post,
        fields: this.getFieldNames(fields.fieldsByTypeName.PostTemplate),
        requestUserId: requestUser ? Number(requestUser.sub) : undefined,
      })
      .lastValue();

    return template ? this.mapToPostTemplate(template) : undefined;
  }

  @Anonymous()
  @Query((returns) => PostTemplate, { nullable: true, description: 'Get post template by alias name.' })
  async postTemplateByName(
    @Args('name', { type: () => String, description: 'Post name' }) name: string,
    @Fields() fields: ResolveTree,
    @User() requestUser?: RequestUser,
  ): Promise<PostTemplate | undefined> {
    const { template } = await this.templateServiceClient
      .getByName({
        name,
        type: TemplatePresetType.Post,
        fields: this.getFieldNames(fields.fieldsByTypeName.PostTemplate),
        requestUserId: requestUser ? Number(requestUser.sub) : undefined,
      })
      .lastValue();

    return template ? this.mapToPostTemplate(template) : undefined;
  }

  @Anonymous()
  @ResolveField((returns) => [TermTaxonomy!], { description: 'Categories' })
  categories(@Parent() { id: objectId }: { id: number }, @Fields() fields: ResolveTree): Promise<TermTaxonomy[]> {
    return this.termTaxonomyServiceClient
      .getListByObjectId({
        objectId,
        taxonomy: TermPresetTaxonomy.Category,
        fields: this.getFieldNames(fields.fieldsByTypeName.TermTaxonomy),
      })
      .lastValue()
      .then((result) => result.termTaxonomies);
  }

  @Anonymous()
  @ResolveField((returns) => [TermTaxonomy!], { description: 'Tags' })
  tags(@Parent() { id: objectId }: { id: number }, @Fields() fields: ResolveTree): Promise<TermTaxonomy[]> {
    return this.termTaxonomyServiceClient
      .getListByObjectId({
        objectId,
        taxonomy: TermPresetTaxonomy.Tag,
        fields: this.getFieldNames(fields.fieldsByTypeName.TermTaxonomy),
      })
      .lastValue()
      .then((result) => result.termTaxonomies);
  }

  @Anonymous()
  @Query((returns) => PagedPostTemplate, { description: 'Get published post templates.' })
  async publishedPostTemplates(
    @Args() args: ClientPagedPostTemplateArgs,
    @Fields() fields: ResolveTree,
  ): Promise<PagedPostTemplate> {
    return this.postTemplates(args, fields);
  }

  @Query((returns) => PagedPostTemplate, { description: 'Get paged post templates.' })
  async postTemplates(
    @Args() args: PagedPostTemplateArgs,
    @Fields() fields: ResolveTree,
    @User() requestUser?: RequestUser,
  ): Promise<PagedPostTemplate> {
    const { categoryId, categoryName, tagId, tagName, ...restArgs } = args;
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
          tagId !== void 0
            ? {
                type: TermPresetTaxonomy.Tag,
                id: tagId,
              }
            : tagName !== void 0
            ? {
                type: TermPresetTaxonomy.Tag,
                name: tagName,
              }
            : false,
        ].filter(Boolean) as GetPagedTemplateRequest['taxonomies'],
        type: TemplatePresetType.Post,
        fields: this.getFieldNames(
          fields.fieldsByTypeName.PagedPostTemplate.rows.fieldsByTypeName.PagedPostTemplateItem,
        ),
        requestUserId: requestUser ? Number(requestUser.sub) : undefined,
      })
      .lastValue()
      .then(({ rows, ...rest }) => ({
        ...rest,
        rows: rows.map((row) => this.mapToPostTemplate(row)),
      }));
  }

  @RamAuthorized(PostTemplateAction.Create)
  @Mutation((returns) => PostTemplate, { description: 'Create a new post template.' })
  async createPostTemplate(
    @Args('model', { type: () => NewPostTemplateInput }) model: NewPostTemplateInput,
    @User() requestUser: RequestUser,
  ): Promise<PostTemplate> {
    const { template } = await this.templateServiceClient
      .createPost({
        ...model,
        excerpt: model.excerpt || '',
        metas: model.metas || [],
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();

    // 新建（当状态为需要审核）审核消息推送
    if (template.status === TemplateStatus.Pending) {
      await this.messageService.publish(
        {
          eventName: 'createPostReview',
          payload: {
            id: template.id,
          },
        },
        { excludes: [requestUser.sub] },
      );
    }

    return this.mapToPostTemplate(template);
  }

  @RamAuthorized(PostTemplateAction.Update)
  @Mutation((returns) => VoidResolver, {
    nullable: true,
    description: 'Update post template (must not be in "trash" status).',
  })
  async updatePostTemplate(
    @Args('id', { type: () => ID, description: 'Post id' }, ParseIntPipe) id: number,
    @Args('model', { type: () => UpdatePostTemplateInput }) model: UpdatePostTemplateInput,
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
          eventName: 'updatePostReview',
          payload: {
            id,
          },
        },
        { excludes: [requestUser.sub] },
      );
    }
  }
}
