import DataLoader from 'dataloader';
import { upperFirst } from 'lodash';
import { ModuleRef } from '@nestjs/core';
import { Resolver, ResolveField, Query, Mutation, Parent, Args, ID, Int } from '@nestjs/graphql';
import { ResolveTree } from 'graphql-parse-resolve-info';
import { VoidResolver } from 'graphql-scalars';
import { Authorized, Anonymous } from '@ace-pomelo/nestjs-oidc';
import { RamAuthorized } from '@ace-pomelo/ram-authorization';
import { Fields, User, RequestUser } from '@ace-pomelo/shared-server';
import {
  TemplateDataSource,
  TermTaxonomyDataSource,
  UserDataSource,
  PagedTemplateArgs,
  TemplateOptionArgs,
  TermTaxonomyModel,
  TemplateStatus,
  TermPresetTaxonomy,
} from '@ace-pomelo/infrastructure-datasource';
import { TemplateAction } from '@/common/actions';
import { BaseResolver } from '@/common/resolvers/base.resolver';
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
export abstract class TaxonomyFieldResolver extends BaseResolver {
  constructor(protected readonly termTaxonomyDataSource: TermTaxonomyDataSource) {
    super();
  }

  protected createDataLoader(
    taxonomy: string,
  ): DataLoader<{ objectId: number; fields: string[] }, TermTaxonomyModel[]> {
    const termLoaderFn = async (keys: Readonly<Array<{ objectId: number; fields: string[] }>>) => {
      if (keys.length) {
        // 所有调用的 taxonomy 和 fields 都是相同的
        const results = await this.termTaxonomyDataSource.getListByObjectId(
          keys.map((key) => key.objectId),
          taxonomy,
          keys[0].fields,
        );
        return keys.map(({ objectId }) => results[objectId] || []);
      } else {
        return Promise.resolve([]);
      }
    };
    return new DataLoader(termLoaderFn);
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

    constructor(termTaxonomyDataSource: TermTaxonomyDataSource) {
      super(termTaxonomyDataSource);

      this.taxonomyDataLoader = this.createDataLoader(options.taxonomy);
    }

    @ResolveField(options.propertyName, (returns) => [TermTaxonomy!], {
      description: options.description || upperFirst(options.propertyName),
    })
    getDynamicTaxonomies(
      @Parent() { id: objectId }: { id: number },
      @Fields() fields: ResolveTree,
    ): Promise<TermTaxonomy[]> {
      if (options.useDataLoader) {
        return this.taxonomyDataLoader.load({
          objectId,
          fields: this.getFieldNames(fields.fieldsByTypeName.TermTaxonomy),
        });
      } else {
        return this.termTaxonomyDataSource.getListByObjectId(
          {
            objectId,
            taxonomy: options.taxonomy,
          },
          this.getFieldNames(fields.fieldsByTypeName.TermTaxonomy),
        );
      }
    }
  }

  return TaxonomyResolver;
};

@Authorized()
@Resolver(() => PagedTemplateItem)
export class PagedTemplateItemCategoryResolver extends createTaxonomyFieldResolver(PagedTemplateItem, {
  propertyName: 'categories',
  taxonomy: TermPresetTaxonomy.Category,
  description: 'Categories',
  useDataLoader: true,
}) {
  constructor(protected readonly termTaxonomyDataSource: TermTaxonomyDataSource) {
    super(termTaxonomyDataSource);
  }
}

@Resolver(() => Template)
export class TemplateCategoryResolver extends createTaxonomyFieldResolver(Template, {
  propertyName: 'categories',
  taxonomy: TermPresetTaxonomy.Category,
  description: 'Categories',
}) {
  constructor(protected readonly termTaxonomyDataSource: TermTaxonomyDataSource) {
    super(termTaxonomyDataSource);
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
  abstract class AuthorResolver extends BaseResolver {
    private authorDataLoader;

    constructor(protected readonly userDataSource: UserDataSource) {
      super();

      this.authorDataLoader = new DataLoader(async (keys: Readonly<Array<{ id: number; fields: string[] }>>) => {
        if (keys.length) {
          const results = await userDataSource.getList([...new Set(keys.map((key) => key.id))], keys[0].fields);
          return keys.map(({ id }) => results.find((item) => item.id === id));
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
    ): Promise<SimpleUser | undefined> {
      if (useDataLoader) {
        return this.authorDataLoader.load({
          id,
          fields: this.getFieldNames(fields.fieldsByTypeName.SimpleUser),
        });
      } else {
        return this.userDataSource.get(id, this.getFieldNames(fields.fieldsByTypeName.SimpleUser));
      }
    }
  }

  return AuthorResolver;
};

@Authorized()
@Resolver(() => PagedTemplateItem)
export class PagedTemplateItemAuthorResolver extends createAuthorFieldResolver(PagedTemplateItem, true) {
  constructor(protected readonly userDataSource: UserDataSource) {
    super(userDataSource);
  }
}

@Authorized()
@Resolver(() => Template)
export class TemplateAuthorResolver extends createAuthorFieldResolver(Template) {
  constructor(protected readonly userDataSource: UserDataSource) {
    super(userDataSource);
  }
}

// #endregion

@Authorized()
@Resolver(() => Template)
export class TemplateResolver extends createMetaResolver(
  Template,
  TemplateMeta,
  NewTemplateMetaInput,
  TemplateDataSource,
  {
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
  },
) {
  constructor(
    protected readonly moduleRef: ModuleRef,
    private readonly templateDataSource: TemplateDataSource,
    private readonly messageService: MessageService,
  ) {
    super(moduleRef);
  }

  @Anonymous()
  @Query((returns) => [TemplateOption], { nullable: true, description: 'Get template options.' })
  async templateOptions(
    @Args() args: BaseTemplateOptionArgs,
    @Fields() fields: ResolveTree,
  ): Promise<TemplateOption[]> {
    const { type, categoryId, categoryName, ...restArgs } = args;
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
      type,
      this.getFieldNames(fields.fieldsByTypeName.TemplateOption),
    );
  }

  @Anonymous()
  @Query((returns) => Template, { nullable: true, description: 'Get template.' })
  template(
    @Args('id', { type: () => ID, description: 'Template id' }) id: number,
    @Fields() fields: ResolveTree,
    @User() requestUser?: RequestUser,
  ): Promise<Template | undefined> {
    return this.templateDataSource.get(
      id,
      'NONE',
      this.getFieldNames(fields.fieldsByTypeName.Template),
      requestUser ? Number(requestUser.sub) : undefined,
    );
  }

  @Anonymous()
  @Query((returns) => Template, { nullable: true, description: 'Get post template by alias name.' })
  templateByName(
    @Args('name', { type: () => String, description: 'Post name' }) name: string,
    @Fields() fields: ResolveTree,
    @User() requestUser?: RequestUser,
  ): Promise<Template | undefined> {
    return this.templateDataSource.getByName(
      name,
      'NONE',
      this.getFieldNames(fields.fieldsByTypeName.Template),
      requestUser ? Number(requestUser.sub) : undefined,
    );
  }

  @RamAuthorized(TemplateAction.Counts)
  @Query((returns) => [TemplateStatusCount], { description: 'Get template count by status.' })
  templateCountByStatus(
    @Args('type', { type: () => String, description: 'Template type' }) type: string,
    @User() requestUser: RequestUser,
  ) {
    return this.templateDataSource.getCountByStatus(type, Number(requestUser.sub));
  }

  @RamAuthorized(TemplateAction.Counts)
  @Query((returns) => Int, { description: 'Get template count by self.' })
  templateCountBySelf(
    @Args('type', { type: () => String, description: 'Template type' }) type: string,
    @Args('includeTrash', { type: () => Boolean, defaultValue: true, description: 'Include "Trash" status datas' })
    includeTrash: boolean,
    @User() requestUser: RequestUser,
  ) {
    return this.templateDataSource.getCountBySelf(type, includeTrash, Number(requestUser.sub));
  }

  @RamAuthorized(TemplateAction.Counts)
  @Query((returns) => [TemplateDayCount], { description: 'Get template count by day.' })
  templateCountByDay(
    @Args('type', { type: () => String, description: 'Template type' }) type: string,
    @Args('month', { description: 'Month (format：yyyyMM)' }) month: string,
  ) {
    return this.templateDataSource.getCountByDay(month, type);
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
  ) {
    return this.templateDataSource.getCountByMonth({ year, months }, type);
  }

  @RamAuthorized(TemplateAction.Counts)
  @Query((returns) => [TemplateYearCount], { description: 'Get template count by year.' })
  templateCountByYear(@Args('type', { type: () => String, description: 'Template type' }) type: string) {
    return this.templateDataSource.getCountByYear(type);
  }

  @Query((returns) => PagedTemplate, { description: 'Get paged templates.' })
  templates(
    @Args() args: PagedBaseTemplateArgs,
    @Fields() fields: ResolveTree,
    @User() requestUser?: RequestUser,
  ): Promise<PagedTemplate> {
    const { type, categoryId, categoryName, ...restArgs } = args;
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
      type,
      this.getFieldNames(fields.fieldsByTypeName.PagedTemplate.rows.fieldsByTypeName.PagedTemplateItem),
      requestUser ? Number(requestUser.sub) : undefined,
    );
  }

  @RamAuthorized(TemplateAction.Create)
  @Mutation((returns) => Template, { description: 'Create a new template.' })
  async createTemplate(
    @Args('model', { type: () => NewTemplateInput }) model: NewTemplateInput,
    @User() requestUser: RequestUser,
  ): Promise<Template> {
    const { type, ...restInput } = model;
    const { id, name, title, author, content, excerpt, status, commentStatus, commentCount, updatedAt, createdAt } =
      await this.templateDataSource.create(
        { ...restInput, excerpt: restInput.excerpt || '' },
        type,
        Number(requestUser.sub),
      );

    // 新建（当状态为需要审核）审核消息推送
    if (status === TemplateStatus.Pending) {
      await this.messageService.publish(
        {
          eventName: 'createTemplateReview',
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
      type,
      commentStatus,
      commentCount,
      updatedAt,
      createdAt,
    };
  }

  @RamAuthorized(TemplateAction.Update)
  @Mutation((returns) => VoidResolver, {
    nullable: true,
    description: 'Update template (must not be in "trash" status).',
  })
  async updateTemplate(
    @Args('id', { type: () => ID, description: 'Form id' }) id: number,
    @Args('model', { type: () => UpdateTemplateInput }) model: UpdateTemplateInput,
    @User() requestUser: RequestUser,
  ): Promise<void> {
    await this.templateDataSource.update(id, model, Number(requestUser.sub));

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
    @Args('id', { type: () => ID, description: 'Template id' }) id: number,
    @Args('status', { type: () => TemplateStatus, description: 'status' }) status: TemplateStatus,
    @User() requestUser: RequestUser,
  ): Promise<void> {
    await this.templateDataSource.updateStatus(id, status, Number(requestUser.sub));
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
    await this.templateDataSource.bulkUpdateStatus(ids, status, Number(requestUser.sub));
  }

  @RamAuthorized(TemplateAction.Restore)
  @Mutation((returns) => VoidResolver, {
    nullable: true,
    description: 'Restore template (must be in "trash" status)',
  })
  async restoreTemplate(
    @Args('id', { type: () => ID, description: 'Template id' }) id: number,
    @User() requestUser: RequestUser,
  ): Promise<void> {
    await this.templateDataSource.restore(id, Number(requestUser.sub));
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
    await this.templateDataSource.bulkRestore(ids, Number(requestUser.sub));
  }

  @RamAuthorized(TemplateAction.Delete)
  @Mutation((returns) => VoidResolver, {
    nullable: true,
    description: 'Delete template permanently (must be in "trash" status).',
  })
  async deleteTemplate(
    @Args('id', { type: () => ID, description: 'Template id' }) id: number,
    @User() requestUser: RequestUser,
  ): Promise<void> {
    await this.templateDataSource.delete(id, Number(requestUser.sub));
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
    await this.templateDataSource.bulkDelete(ids, Number(requestUser.sub));
  }
}
