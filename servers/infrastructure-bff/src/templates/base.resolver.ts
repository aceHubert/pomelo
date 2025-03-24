import DataLoader from 'dataloader';
import { upperFirst } from 'lodash';
import { Inject, ParseIntPipe, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Resolver, ResolveField, Query, Mutation, Parent, Args, ID, Int } from '@nestjs/graphql';
import { ResolveTree } from 'graphql-parse-resolve-info';
import { VoidResolver } from 'graphql-scalars';
import { Authorized, Anonymous } from '@ace-pomelo/nestjs-authorization';
import { RamAuthorized } from '@ace-pomelo/nestjs-ram-authorization';
import {
  Fields,
  User,
  RequestUser,
  TemplateStatus,
  TemplateCommentStatus,
  TermPresetTaxonomy,
  POMELO_SERVICE_PACKAGE_NAME,
} from '@ace-pomelo/shared/server';
import {
  TEMPLATE_SERVICE_NAME,
  TemplateServiceClient,
  GetTemplateOptionsRequest,
  TemplateModel,
  GetPagedTemplateRequest,
} from '@ace-pomelo/shared/server/proto-ts/template';
import {
  TERM_TAXONOMY_SERVICE_NAME,
  TermTaxonomyServiceClient,
} from '@ace-pomelo/shared/server/proto-ts/term-taxonomy';
import { USER_SERVICE_NAME, UserServiceClient } from '@ace-pomelo/shared/server/proto-ts/user';
import { TemplateAction } from '@/common/actions';
import { BaseResolver } from '@/common/resolvers/base.resolver';
import { WrapperTemplateStatus, WrapperTemplateCommentStatus } from '@/common/utils/wrapper-enum.util';
import { createMetaResolver } from '@/common/resolvers/meta.resolver';
import { MessageService } from '@/messages/message.service';
import { TermTaxonomy } from '@/term-taxonomy/models/term-taxonomy.model';
import { SimpleUser } from '@/users/models/user.model';
import { NewTemplateInput } from './dto/new-template.input';
import { NewTemplateMetaInput } from './dto/new-template-meta.input';
import { UpdateTemplateInput } from './dto/update-template.input';
import { PagedBaseTemplateArgs, BaseTemplateOptionArgs } from './dto/template.args';
import {
  Template,
  PagedTemplateItem,
  TemplateOption,
  TemplateMeta,
  PagedTemplate,
  TemplateStatusCount,
  TemplateDayCount,
  TemplateMonthCount,
  TemplateYearCount,
} from './models/base.model';

// #region Taxonomy field resolver

/**
 * Taxonomy base field resolver
 */
export abstract class TaxonomyFieldResolver extends BaseResolver implements OnModuleInit {
  protected termTaxonomyServiceClient!: TermTaxonomyServiceClient;

  constructor(private readonly client: ClientGrpc) {
    super();
  }

  onModuleInit() {
    this.termTaxonomyServiceClient = this.client.getService<TermTaxonomyServiceClient>(TERM_TAXONOMY_SERVICE_NAME);
  }

  protected createDataLoader(taxonomy: string): DataLoader<{ objectId: number; fields: string[] }, TermTaxonomy[]> {
    return new DataLoader(async (keys: Readonly<Array<{ objectId: number; fields: string[] }>>) => {
      if (keys.length) {
        // 所有调用的 taxonomy 和 fields 都是相同的
        const { termTaxonomies } = await this.termTaxonomyServiceClient
          .getListByObjectIds({
            objectIds: keys.map((key) => key.objectId),
            taxonomy,
            fields: keys[0].fields,
          })
          .lastValue();
        return keys.map(({ objectId }) => termTaxonomies.find((item) => item.objectId === objectId)?.value || []);
      } else {
        return Promise.resolve([]);
      }
    });
  }
}

/**
 * 创建单个 Taxonomy field resolver
 * @param resolverType  Resolver type
 * @param options Options
 */
export const createTaxonomyFieldResolver = (
  resolverType: Function,
  options: {
    /** ResolveField property name */
    propertyName: string;
    /** Taxonomy type  */
    taxonomy: string;
    /** Field description, default: upper first "propertyName" */
    description?: string;
    /** Use "DataLoader", prefer using in paged items */
    useDataLoader?: boolean;
  },
) => {
  @Resolver(() => resolverType, { isAbstract: true })
  abstract class TaxonomyResolver extends TaxonomyFieldResolver {
    private taxonomyDataLoader;

    constructor(client: ClientGrpc) {
      super(client);
      this.taxonomyDataLoader = this.createDataLoader(options.taxonomy);
    }

    @ResolveField(options.propertyName, (returns) => [TermTaxonomy!], {
      description: options.description || upperFirst(options.propertyName),
    })
    async getDynamicTaxonomies(
      @Parent() { id: objectId }: { id: number },
      @Fields() fields: ResolveTree,
    ): Promise<TermTaxonomy[]> {
      if (options.useDataLoader) {
        return this.taxonomyDataLoader.load({
          objectId,
          fields: this.getFieldNames(fields.fieldsByTypeName.TermTaxonomy),
        });
      } else {
        const { termTaxonomies } = await this.termTaxonomyServiceClient
          .getListByObjectId({
            objectId,
            taxonomy: options.taxonomy,
            fields: this.getFieldNames(fields.fieldsByTypeName.TermTaxonomy),
          })
          .lastValue();

        return termTaxonomies;
      }
    }
  }

  return TaxonomyResolver;
};

@Authorized()
@Resolver(() => PagedTemplateItem)
export class PagedTemplateItemCategoryResolver
  extends createTaxonomyFieldResolver(PagedTemplateItem, {
    propertyName: 'categories',
    taxonomy: TermPresetTaxonomy.Category,
    description: 'Categories',
    useDataLoader: true,
  })
  implements OnModuleInit
{
  constructor(@Inject(POMELO_SERVICE_PACKAGE_NAME) client: ClientGrpc) {
    super(client);
  }
}

@Resolver(() => Template)
export class TemplateCategoryResolver extends createTaxonomyFieldResolver(Template, {
  propertyName: 'categories',
  taxonomy: TermPresetTaxonomy.Category,
  description: 'Categories',
}) {
  constructor(@Inject(POMELO_SERVICE_PACKAGE_NAME) client: ClientGrpc) {
    super(client);
  }
}
// #endregion

// #region Author field resolver

/**
 * 创建 author field resolver
 * @param resolverType Resolver type
 * @param useDataLoader use DataLoader
 */
export const createAuthorFieldResolver = (
  resolverType: Function,
  /** Use "DataLoader", prefer using in paged items */
  useDataLoader?: boolean,
) => {
  @Resolver(() => resolverType, { isAbstract: true })
  abstract class AuthorResolver extends BaseResolver implements OnModuleInit {
    protected userServiceClient!: UserServiceClient;
    private authorDataLoader;

    constructor(private readonly client: ClientGrpc) {
      super();
      this.authorDataLoader = this.createDataLoader();
    }

    onModuleInit() {
      this.userServiceClient = this.client.getService<UserServiceClient>(USER_SERVICE_NAME);
    }

    private createDataLoader(): DataLoader<
      { id: number; fields: string[]; requestUserId: number },
      SimpleUser | undefined
    > {
      return new DataLoader(async (keys: Readonly<Array<{ id: number; fields: string[]; requestUserId: number }>>) => {
        if (keys.length) {
          const { users } = await this.userServiceClient
            .getList({
              ids: [...new Set(keys.map((key) => key.id))],
              fields: keys[0].fields,
              requestUserId: keys[0].requestUserId,
            })
            .lastValue();

          return keys.map(({ id }) => users.find((item) => item.id === id));
        } else {
          return Promise.resolve([]);
        }
      });
    }

    @ResolveField('author', (returns) => SimpleUser, {
      nullable: true,
      description: 'Author',
    })
    getAuthor(
      @Parent() { author: id }: { author: number },
      @Fields() fields: ResolveTree,
      @User() requestUser: RequestUser,
    ): Promise<SimpleUser | undefined> {
      if (useDataLoader) {
        return this.authorDataLoader.load({
          id,
          fields: this.getFieldNames(fields.fieldsByTypeName.SimpleUser),
          requestUserId: Number(requestUser.sub),
        });
      } else {
        return this.userServiceClient
          .getUser({
            id,
            fields: this.getFieldNames(fields.fieldsByTypeName.SimpleUser),
            requestUserId: Number(requestUser.sub),
          })
          .lastValue()
          .then(({ user }) => user);
      }
    }
  }

  return AuthorResolver;
};

@Authorized()
@Resolver(() => PagedTemplateItem)
export class PagedTemplateItemAuthorResolver extends createAuthorFieldResolver(PagedTemplateItem, true) {
  constructor(@Inject(POMELO_SERVICE_PACKAGE_NAME) client: ClientGrpc) {
    super(client);
  }
}

@Authorized()
@Resolver(() => Template)
export class TemplateAuthorResolver extends createAuthorFieldResolver(Template) {
  constructor(@Inject(POMELO_SERVICE_PACKAGE_NAME) client: ClientGrpc) {
    super(client);
  }
}

// #endregion

@Authorized()
@Resolver(() => Template)
export class TemplateResolver
  extends createMetaResolver('template', Template, TemplateMeta, NewTemplateMetaInput, {
    authDecorator: (method) => {
      const ramAction =
        method === 'getMeta'
          ? TemplateAction.MetaDetail
          : method === 'getMetas' || method === 'fieldMetas'
          ? TemplateAction.MetaList
          : method === 'createMeta' || method === 'createMetas'
          ? TemplateAction.MetaCreate
          : method === 'updateMeta' || method === 'updateMetaByKey'
          ? TemplateAction.MetaUpdate
          : TemplateAction.MetaDelete;

      return method === 'getMeta' || method === 'getMetas'
        ? [RamAuthorized(ramAction), Anonymous()]
        : [RamAuthorized(ramAction)];
    },
  })
  implements OnModuleInit
{
  private templateServiceClient!: TemplateServiceClient;

  constructor(
    @Inject(POMELO_SERVICE_PACKAGE_NAME) private readonly client: ClientGrpc,
    private readonly messageService: MessageService,
  ) {
    super();
  }

  onModuleInit() {
    this.templateServiceClient = this.client.getService<TemplateServiceClient>(TEMPLATE_SERVICE_NAME);
  }

  get metaServiceClient() {
    return this.templateServiceClient;
  }

  private mapToTemplate(model: TemplateModel): Template {
    return {
      ...model,
      status: WrapperTemplateStatus.asValueOrDefault(model.status, TemplateStatus.Publish),
      commentStatus: WrapperTemplateCommentStatus.asValueOrDefault(model.commentStatus, TemplateCommentStatus.Open),
    };
  }

  @Anonymous()
  @Query((returns) => [TemplateOption], { nullable: true, description: 'Get template options.' })
  async templateOptions(
    @Args() args: BaseTemplateOptionArgs,
    @Fields() fields: ResolveTree,
  ): Promise<TemplateOption[]> {
    const { type, categoryId, categoryName, ...restArgs } = args;
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
        type,
        fields: this.getFieldNames(fields.fieldsByTypeName.TemplateOption),
      })
      .lastValue();

    return options;
  }

  @Anonymous()
  @Query((returns) => Template, { nullable: true, description: 'Get template.' })
  async template(
    @Args('id', { type: () => ID, description: 'Template id' }, ParseIntPipe) id: number,
    @Fields() fields: ResolveTree,
    @User() requestUser?: RequestUser,
  ): Promise<Template | undefined> {
    const { template } = await this.templateServiceClient
      .get({
        id,
        fields: this.getFieldNames(fields.fieldsByTypeName.Template),
        requestUserId: requestUser ? Number(requestUser.sub) : undefined,
      })
      .lastValue();

    return template ? this.mapToTemplate(template) : undefined;
  }

  @Anonymous()
  @Query((returns) => Template, { nullable: true, description: 'Get post template by alias name.' })
  async templateByName(
    @Args('name', { type: () => String, description: 'Post name' }) name: string,
    @Fields() fields: ResolveTree,
    @User() requestUser?: RequestUser,
  ): Promise<Template | undefined> {
    const { template } = await this.templateServiceClient
      .getByName({
        name,
        fields: this.getFieldNames(fields.fieldsByTypeName.Template),
        requestUserId: requestUser ? Number(requestUser.sub) : undefined,
      })
      .lastValue();

    return template ? this.mapToTemplate(template) : undefined;
  }

  @RamAuthorized(TemplateAction.Counts)
  @Query((returns) => [TemplateStatusCount], { description: 'Get template count by status.' })
  templateCountByStatus(
    @Args('type', { type: () => String, description: 'Template type' }) type: string,
    @User() requestUser: RequestUser,
  ): Promise<Array<{ status: TemplateStatus; count: number }>> {
    return this.templateServiceClient
      .getCountByStatus({
        type,
        requestUserId: Number(requestUser.sub),
      })
      .lastValue()
      .then(({ counts }) =>
        counts.map(({ status, ...rest }) => ({
          ...rest,
          status: WrapperTemplateStatus.asValueOrDefault(status, TemplateStatus.Publish),
        })),
      );
  }

  @RamAuthorized(TemplateAction.Counts)
  @Query((returns) => Int, { description: 'Get template count by self.' })
  templateCountBySelf(
    @Args('type', { type: () => String, description: 'Template type' }) type: string,
    @Args('includeTrash', { type: () => Boolean, defaultValue: true, description: 'Include "Trash" status datas' })
    includeTrash: boolean,
    @User() requestUser: RequestUser,
  ): Promise<number> {
    return this.templateServiceClient
      .getSelfCount({
        type,
        includeTrashStatus: includeTrash,
        requestUserId: Number(requestUser.sub),
      })
      .lastValue()
      .then((result) => result.counts);
  }

  @RamAuthorized(TemplateAction.Counts)
  @Query((returns) => [TemplateDayCount], { description: 'Get template count by day.' })
  templateCountByDay(
    @Args('type', { type: () => String, description: 'Template type' }) type: string,
    @Args('month', { description: 'Month (format：yyyyMM)' }) month: string,
  ): Promise<Array<{ day: string; count: number }>> {
    return this.templateServiceClient
      .getCountByDay({
        month,
        type,
      })
      .lastValue()
      .then((result) => result.counts);
  }

  @RamAuthorized(TemplateAction.Counts)
  @Query((returns) => [TemplateMonthCount], { description: 'Get template count by month.' })
  templateCountByMonth(
    @Args('type', { type: () => String, description: 'Template type' }) type: string,
    @Args('year', { type: () => String, nullable: true, description: 'Year (format：yyyy)' }) year: string | undefined,
    @Args('months', {
      type: () => Int,
      nullable: true,
      description: 'Latest number of months from current (default: 12)',
    })
    months: number | undefined,
  ): Promise<Array<{ month: string; count: number }>> {
    return this.templateServiceClient
      .getCountByMonth({
        months,
        year,
        type,
      })
      .lastValue()
      .then((result) => result.counts);
  }

  @RamAuthorized(TemplateAction.Counts)
  @Query((returns) => [TemplateYearCount], { description: 'Get template count by year.' })
  templateCountByYear(
    @Args('type', { type: () => String, description: 'Template type' }) type: string,
  ): Promise<Array<{ year: string; count: number }>> {
    return this.templateServiceClient
      .getCountByYear({
        type,
      })
      .lastValue()
      .then((result) => result.counts);
  }

  @Query((returns) => PagedTemplate, { description: 'Get paged templates.' })
  templates(
    @Args() args: PagedBaseTemplateArgs,
    @Fields() fields: ResolveTree,
    @User() requestUser?: RequestUser,
  ): Promise<PagedTemplate> {
    const { type, categoryId, categoryName, ...restArgs } = args;
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
        type,
        fields: this.getFieldNames(fields.fieldsByTypeName.PagedTemplate.rows.fieldsByTypeName.PagedTemplateItem),
        requestUserId: requestUser ? Number(requestUser.sub) : undefined,
      })
      .lastValue()
      .then(({ rows, ...rest }) => ({
        ...rest,
        rows: rows.map((model) => this.mapToTemplate(model)),
      }));
  }

  @RamAuthorized(TemplateAction.Create)
  @Mutation((returns) => Template, { description: 'Create a new template.' })
  async createTemplate(
    @Args('model', { type: () => NewTemplateInput }) model: NewTemplateInput,
    @User() requestUser: RequestUser,
  ): Promise<Template> {
    const { template } = await this.templateServiceClient
      .create({
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
          eventName: 'createTemplateReview',
          payload: {
            id: template.id,
          },
        },
        { excludes: [requestUser.sub] },
      );
    }

    return this.mapToTemplate(template);
  }

  @RamAuthorized(TemplateAction.Update)
  @Mutation((returns) => VoidResolver, {
    nullable: true,
    description: 'Update template (must not be in "trash" status).',
  })
  async updateTemplate(
    @Args('id', { type: () => ID, description: 'Template id' }, ParseIntPipe) id: number,
    @Args('model', { type: () => UpdateTemplateInput }) model: UpdateTemplateInput,
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
          eventName: 'updateTemplateReview',
          payload: {
            id,
          },
        },
        { excludes: [requestUser.sub] },
      );
    }
  }

  @RamAuthorized(TemplateAction.UpdateStatus)
  @Mutation((returns) => VoidResolver, {
    nullable: true,
    description: 'Update template stauts (must not be in "trash" status)',
  })
  async updateTemplateStatus(
    @Args('id', { type: () => ID, description: 'Template id' }, ParseIntPipe) id: number,
    @Args('status', { type: () => TemplateStatus, description: 'status' }) status: TemplateStatus,
    @User() requestUser: RequestUser,
  ): Promise<void> {
    await this.templateServiceClient
      .updateStatus({
        id,
        status,
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();
  }

  @RamAuthorized(TemplateAction.BulkUpdateStatus)
  @Mutation((returns) => VoidResolver, {
    nullable: true,
    description: `Update the bulk of templates' status (must not be in "trash" status)`,
  })
  async bulkUpdateTemplateStatus(
    @Args('ids', { type: () => [ID!], description: 'Template ids' }) ids: number[],
    @Args('status', { type: () => TemplateStatus, description: 'Status' }) status: TemplateStatus,
    @User() requestUser: RequestUser,
  ): Promise<void> {
    await this.templateServiceClient
      .bulkUpdateStatus({
        ids,
        status,
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();
  }

  @RamAuthorized(TemplateAction.Restore)
  @Mutation((returns) => VoidResolver, {
    nullable: true,
    description: 'Restore template (must be in "trash" status)',
  })
  async restoreTemplate(
    @Args('id', { type: () => ID, description: 'Template id' }, ParseIntPipe) id: number,
    @User() requestUser: RequestUser,
  ): Promise<void> {
    await this.templateServiceClient
      .restore({
        id,
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();
  }

  @RamAuthorized(TemplateAction.BulkRestore)
  @Mutation((returns) => VoidResolver, {
    nullable: true,
    description: 'Restore the bulk of templates (must be in "trash" status)',
  })
  async bulkRestoreTemplate(
    @Args('ids', { type: () => [ID!], description: 'Template ids' }) ids: number[],
    @User() requestUser: RequestUser,
  ): Promise<void> {
    await this.templateServiceClient
      .bulkRestore({
        ids,
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();
  }

  @RamAuthorized(TemplateAction.Delete)
  @Mutation((returns) => VoidResolver, {
    nullable: true,
    description: 'Delete template permanently (must be in "trash" status).',
  })
  async deleteTemplate(
    @Args('id', { type: () => ID, description: 'Template id' }, ParseIntPipe) id: number,
    @User() requestUser: RequestUser,
  ): Promise<void> {
    await this.templateServiceClient
      .delete({
        id,
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();
  }

  @RamAuthorized(TemplateAction.BulkDelete)
  @Mutation((returns) => VoidResolver, {
    nullable: true,
    description: 'Delete the bulk of templates permanently (must be in "trash" status).',
  })
  async bulkDeleteTemplate(
    @Args('ids', { type: () => [ID!], description: 'Template ids' }) ids: number[],
    @User() requestUser: RequestUser,
  ): Promise<void> {
    await this.templateServiceClient
      .bulkDelete({
        ids,
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();
  }
}
