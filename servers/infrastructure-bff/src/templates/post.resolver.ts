import { Inject, ParseIntPipe } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
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
  TemplatePresetType,
  TermPresetTaxonomy,
  INFRASTRUCTURE_SERVICE,
  TemplatePattern,
  TermTaxonomyPattern,
} from '@ace-pomelo/shared/server';
import { TemplateAction, PostTemplateAction } from '@/common/actions';
import { createMetaFieldResolver } from '@/common/resolvers/meta.resolver';
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

  constructor(@Inject(INFRASTRUCTURE_SERVICE) protected readonly basicService: ClientProxy) {
    super(basicService);

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
  constructor(@Inject(INFRASTRUCTURE_SERVICE) protected readonly basicService: ClientProxy) {
    super(basicService);
  }
}

@Authorized()
@Resolver(() => PostTemplate)
export class PostTemplateAuthorResolver extends createAuthorFieldResolver(PostTemplate) {
  constructor(@Inject(INFRASTRUCTURE_SERVICE) protected readonly basicService: ClientProxy) {
    super(basicService);
  }
}

// #endregion

@Authorized()
@Resolver(() => PagedPostTemplateItem)
export class PagedPostTemplateItemMetaFieldResolver extends createMetaFieldResolver(PagedPostTemplateItem, {
  modelName: 'template',
  authDecorator: () => RamAuthorized(TemplateAction.MetaList),
}) {
  constructor(@Inject(INFRASTRUCTURE_SERVICE) protected readonly basicService: ClientProxy) {
    super(basicService);
  }
}

@Authorized()
@Resolver(() => PostTemplate)
export class PostTemplateResolver extends createMetaFieldResolver(PostTemplate, {
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
  @Query((returns) => [PostTemplateOption], { nullable: true, description: 'Get post template options.' })
  postTemplateOptions(
    @Args() args: PostTemplateOptionArgs,
    @Fields() fields: ResolveTree,
  ): Promise<PostTemplateOption[]> {
    const { categoryId, categoryName, tagId, tagName, ...restArgs } = args;
    return this.basicService
      .send<PostTemplateOption[]>(TemplatePattern.GetOptions, {
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
          ].filter(Boolean),
        },
        type: TemplatePresetType.Post,
        fields: this.getFieldNames(fields.fieldsByTypeName.PostTemplateOption),
      })
      .lastValue();
  }

  @Anonymous()
  @Query((returns) => PostTemplate, { nullable: true, description: 'Get post template.' })
  postTemplate(
    @Args('id', { type: () => ID, description: 'Post id' }, ParseIntPipe) id: number,
    @Fields() fields: ResolveTree,
    @User() requestUser?: RequestUser,
  ): Promise<PostTemplate | undefined> {
    return this.basicService
      .send<PostTemplate | undefined>(TemplatePattern.Get, {
        id,
        type: TemplatePresetType.Post,
        fields: this.getFieldNames(fields.fieldsByTypeName.PostTemplate),
        requestUserId: requestUser ? Number(requestUser.sub) : undefined,
      })
      .lastValue();
  }

  @Anonymous()
  @Query((returns) => PostTemplate, { nullable: true, description: 'Get post template by alias name.' })
  postTemplateByName(
    @Args('name', { type: () => String, description: 'Post name' }) name: string,
    @Fields() fields: ResolveTree,
    @User() requestUser?: RequestUser,
  ): Promise<PostTemplate | undefined> {
    return this.basicService
      .send<PostTemplate | undefined>(TemplatePattern.GetByName, {
        name,
        type: TemplatePresetType.Post,
        fields: this.getFieldNames(fields.fieldsByTypeName.PostTemplate),
        requestUserId: requestUser ? Number(requestUser.sub) : undefined,
      })
      .lastValue();
  }

  @Anonymous()
  @ResolveField((returns) => [TermTaxonomy!], { description: 'Categories' })
  categories(@Parent() { id: objectId }: { id: number }, @Fields() fields: ResolveTree): Promise<TermTaxonomy[]> {
    return this.basicService
      .send<TermTaxonomy[]>(TermTaxonomyPattern.GetListByObjectId, {
        query: {
          objectId,
          taxonomy: TermPresetTaxonomy.Category,
        },
        fields: this.getFieldNames(fields.fieldsByTypeName.TermTaxonomy),
      })
      .lastValue();
  }

  @Anonymous()
  @ResolveField((returns) => [TermTaxonomy!], { description: 'Tags' })
  tags(@Parent() { id: objectId }: { id: number }, @Fields() fields: ResolveTree): Promise<TermTaxonomy[]> {
    return this.basicService
      .send<TermTaxonomy[]>(TermTaxonomyPattern.GetListByObjectId, {
        query: {
          objectId,
          taxonomy: TermPresetTaxonomy.Tag,
        },
        fields: this.getFieldNames(fields.fieldsByTypeName.TermTaxonomy),
      })
      .lastValue();
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
    const { rows, total } = await this.basicService
      .send<PagedPostTemplate>(TemplatePattern.GetPaged, {
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
          ].filter(Boolean),
        },
        type: TemplatePresetType.Post,
        fields: this.getFieldNames(
          fields.fieldsByTypeName.PagedPostTemplate.rows.fieldsByTypeName.PagedPostTemplateItem,
        ),
        requestUserId: requestUser ? Number(requestUser.sub) : undefined,
      })
      .lastValue();

    return {
      rows,
      total,
    };
  }

  @RamAuthorized(PostTemplateAction.Create)
  @Mutation((returns) => PostTemplate, { description: 'Create a new post template.' })
  async createPostTempate(
    @Args('model', { type: () => NewPostTemplateInput }) model: NewPostTemplateInput,
    @User() requestUser: RequestUser,
  ): Promise<PostTemplate> {
    const { id, name, title, author, content, excerpt, status, commentStatus, commentCount, updatedAt, createdAt } =
      await this.basicService
        .send<PostTemplate>(TemplatePattern.CreatePost, {
          ...model,
          excerpt: model.excerpt || '',
          requestUserId: Number(requestUser.sub),
        })
        .lastValue();

    // 新建（当状态为需要审核）审核消息推送
    if (status === TemplateStatus.Pending) {
      await this.messageService.publish(
        {
          eventName: 'createPostReview',
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
      excerpt,
      status,
      commentStatus,
      commentCount,
      updatedAt,
      createdAt,
    };
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
    await this.basicService
      .send<void>(TemplatePattern.UpdatePost, {
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
