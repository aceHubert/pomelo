import { ModuleRef } from '@nestjs/core';
import { Resolver, ResolveField, Parent, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { Fields, User, RequestUser } from '@ace-pomelo/shared-server';
import {
  TemplateDataSource,
  TermTaxonomyDataSource,
  PagedTemplateArgs,
  TemplateOptionArgs,
  TemplateStatus,
  TemplatePresetType,
  TermPresetTaxonomy,
} from '@ace-pomelo/infrastructure-datasource';
import { ResolveTree } from 'graphql-parse-resolve-info';
import { Anonymous, Authorized } from '@ace-pomelo/authorization';
import { RamAuthorized } from '@ace-pomelo/ram-authorization';
import { TemplateAction, PostTemplateAction } from '@/common/actions';
import { createMetaFieldResolver } from '@/common/resolvers/meta.resolver';
import { MessageService } from '@/messages/message.service';
import { TermTaxonomy } from '../term-taxonomy/models/term-taxonomy.model';
import { TaxonomyFieldResolver } from './base.resolver';
import { NewPostTemplateInput } from './dto/new-template.input';
import { UpdatePostTemplateInput } from './dto/update-template.input';
import { PagedPostTemplateArgs, PostTemplateOptionArgs } from './dto/template.args';
import { PostTemplate, PagedPostTemplateItem, PagedPostTemplate, PostTemplateOption } from './models/post.model';

@Authorized()
@Resolver(() => PagedPostTemplateItem)
export class PagedPostTemplateItemTaxonomyFieldResolver extends TaxonomyFieldResolver {
  private categoryDataLoader;
  private tagDataLoader;

  constructor(termTaxonomyDataSource: TermTaxonomyDataSource) {
    super(termTaxonomyDataSource);

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

@Authorized()
@Resolver(() => PostTemplate)
export class PostTemplateResolver extends createMetaFieldResolver(PostTemplate, TemplateDataSource, {
  authDecorator: () => RamAuthorized(TemplateAction.MetaList),
}) {
  constructor(
    protected readonly moduleRef: ModuleRef,
    private readonly templateDataSource: TemplateDataSource,
    private readonly termTaxonomyDataSource: TermTaxonomyDataSource,
    private readonly messageService: MessageService,
  ) {
    super(moduleRef);
  }

  @Anonymous()
  @Query((returns) => [PostTemplateOption], { nullable: true, description: 'Get post template options.' })
  postTemplateOptions(
    @Args() args: PostTemplateOptionArgs,
    @Fields() fields: ResolveTree,
  ): Promise<PostTemplateOption[]> {
    const { categoryId, categoryName, tagId, tagName, ...restArgs } = args;
    return this.templateDataSource.getOptions(
      {
        ...restArgs,
        taxonomies: [
          categoryId !== void 0
            ? { type: TermPresetTaxonomy.Category, id: categoryId }
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
        ].filter(Boolean) as TemplateOptionArgs['taxonomies'],
      },
      TemplatePresetType.Post,
      this.getFieldNames(fields.fieldsByTypeName.PostTemplateOption),
    );
  }

  @Anonymous()
  @Query((returns) => PostTemplate, { nullable: true, description: 'Get post template.' })
  postTemplate(
    @Args('id', { type: () => ID, description: 'Post id' }) id: number,
    @Fields() fields: ResolveTree,
    @User() requestUser?: RequestUser,
  ): Promise<PostTemplate | undefined> {
    return this.templateDataSource.get(
      id,
      TemplatePresetType.Post,
      this.getFieldNames(fields.fieldsByTypeName.PostTemplate),
      requestUser,
    );
  }

  @Anonymous()
  @Query((returns) => PostTemplate, { nullable: true, description: 'Get post template by alias name.' })
  postTemplateByName(
    @Args('name', { type: () => String, description: 'Post name' }) name: string,
    @Fields() fields: ResolveTree,
    @User() requestUser?: RequestUser,
  ): Promise<PostTemplate | undefined> {
    return this.templateDataSource.getByName(
      name,
      TemplatePresetType.Post,
      this.getFieldNames(fields.fieldsByTypeName.PostTemplate),
      requestUser,
    );
  }

  @Anonymous()
  @ResolveField((returns) => [TermTaxonomy!], {
    description: 'Categories',
  })
  categories(@Parent() { id: objectId }: { id: number }, @Fields() fields: ResolveTree): Promise<TermTaxonomy[]> {
    return this.termTaxonomyDataSource.getListByObjectId(
      {
        objectId,
        taxonomy: TermPresetTaxonomy.Category,
      },
      this.getFieldNames(fields.fieldsByTypeName.TermTaxonomy),
    );
  }

  @Anonymous()
  @ResolveField((returns) => [TermTaxonomy!], {
    description: 'Tags',
  })
  tags(@Parent() { id: objectId }: { id: number }, @Fields() fields: ResolveTree): Promise<TermTaxonomy[]> {
    return this.termTaxonomyDataSource.getListByObjectId(
      {
        objectId,
        taxonomy: TermPresetTaxonomy.Tag,
      },
      this.getFieldNames(fields.fieldsByTypeName.TermTaxonomy),
    );
  }

  @RamAuthorized(PostTemplateAction.PagedList)
  @Query((returns) => PagedPostTemplate, { description: 'Get paged post templates.' })
  async postTemplates(
    @Args() args: PagedPostTemplateArgs,
    @Fields() fields: ResolveTree,
    @User() requestUser?: RequestUser,
  ): Promise<PagedPostTemplate> {
    const { categoryId, categoryName, tagId, tagName, ...restArgs } = args;
    const { rows, total } = await this.templateDataSource.getPaged(
      {
        ...restArgs,
        taxonomies: [
          categoryId !== void 0
            ? { type: TermPresetTaxonomy.Category, id: categoryId }
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
        ].filter(Boolean) as PagedTemplateArgs['taxonomies'],
      },
      TemplatePresetType.Post,
      this.getFieldNames(fields.fieldsByTypeName.PagedPostTemplate.rows.fieldsByTypeName.PagedPostTemplateItem),
      requestUser,
    );

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
      await this.templateDataSource.create(
        { ...model, excerpt: model.excerpt || '' },
        TemplatePresetType.Post,
        requestUser,
      );

    // 新建（当状态为需要审核）审核消息推送
    if (status === TemplateStatus.Pending) {
      await this.messageService.publish({
        excludes: [requestUser.sub],
        message: {
          eventName: 'createPostReview',
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
      excerpt,
      status,
      commentStatus,
      commentCount,
      updatedAt,
      createdAt,
    };
  }

  @RamAuthorized(PostTemplateAction.Update)
  @Mutation((returns) => Boolean, { description: 'Update post template (must not be in "trash" status).' })
  async updatePostTemplate(
    @Args('id', { type: () => ID, description: 'Post id' }) id: number,
    @Args('model', { type: () => UpdatePostTemplateInput }) model: UpdatePostTemplateInput,
    @User() requestUser: RequestUser,
  ): Promise<boolean> {
    const result = await this.templateDataSource.update(id, model, requestUser);

    // 修改（当状态为需要审核并且有任何修改）审核消息推送
    if (result && model.status === TemplateStatus.Pending) {
      await this.messageService.publish({
        excludes: [requestUser.sub],
        message: {
          eventName: 'updatePostReview',
          payload: {
            id,
          },
        },
      });
    }

    return result;
  }
}
