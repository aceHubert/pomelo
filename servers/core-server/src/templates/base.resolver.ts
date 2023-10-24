import DataLoader from 'dataloader';
import { upperFirst } from 'lodash';
import { ModuleRef } from '@nestjs/core';
import { Resolver, ResolveField, Query, Mutation, Parent, Args, ID, Int } from '@nestjs/graphql';
import { Authorized, Anonymous } from 'nestjs-authorization';
import { RamAuthorized } from 'nestjs-ram-authorization';
import { ResolveTree } from 'graphql-parse-resolve-info';
import { BaseResolver, Fields, User, RequestUser } from '@pomelo/shared-server';
import {
  TemplateDataSource,
  TermTaxonomyDataSource,
  PagedTemplateArgs,
  TemplateOptionArgs,
  TermTaxonomyModel,
  Taxonomy as TaxonomyEnum,
  Taxonomy,
  TemplateStatus,
} from '@pomelo/datasource';
import { TemplateAction } from '@/common/actions';
import { createMetaResolver } from '@/common/resolvers/meta.resolver';
import { MessageService } from '@/messages/message.service';
import { TermTaxonomy } from '../term-taxonomy/models/term-taxonomy.model';
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
  taxonomy: TaxonomyEnum.Category,
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
  taxonomy: TaxonomyEnum.Category,
  description: 'Categories',
}) {
  constructor(protected readonly termTaxonomyDataSource: TermTaxonomyDataSource) {
    super(termTaxonomyDataSource);
  }
}

@Authorized()
@Resolver(() => Template)
export class TemplateResolver extends createMetaResolver(
  Template,
  TemplateMeta,
  NewTemplateMetaInput,
  TemplateDataSource,
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
          (categoryId !== void 0 || categoryName !== void 0) && {
            taxonomyType: Taxonomy.Category,
            taxonomyId: categoryId,
            taxonomyName: categoryName,
          },
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
    return this.templateDataSource.get(id, void 0, this.getFieldNames(fields.fieldsByTypeName.Template), requestUser);
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
      void 0,
      this.getFieldNames(fields.fieldsByTypeName.Template),
      requestUser,
    );
  }

  @RamAuthorized(TemplateAction.Counts)
  @Query((returns) => [TemplateStatusCount], { description: 'Get template count by status.' })
  templateCountByStatus(
    @Args('type', { type: () => String, description: 'Template type' }) type: string,
    @User() requestUser: RequestUser,
  ) {
    return this.templateDataSource.getCountByStatus(type, requestUser);
  }

  @RamAuthorized(TemplateAction.Counts)
  @Query((returns) => Int, { description: 'Get template count by self.' })
  templateCountBySelf(
    @Args('type', { type: () => String, description: 'Template type' }) type: string,
    @Args('includeTrash', { type: () => Boolean, defaultValue: true, description: 'Include "Trash" status datas' })
    includeTrash: boolean,
    @User() requestUser: RequestUser,
  ) {
    return this.templateDataSource.getCountBySelf(type, includeTrash, requestUser);
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

  @RamAuthorized(TemplateAction.PagedList)
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
          (categoryId !== void 0 || categoryName !== void 0) && {
            taxonomyType: Taxonomy.Category,
            taxonomyId: categoryId,
            taxonomyName: categoryName,
          },
        ].filter(Boolean) as PagedTemplateArgs['taxonomies'],
      },
      type,
      this.getFieldNames(fields.fieldsByTypeName.PagedTemplate.rows.fieldsByTypeName.PagedTemplateItem),
      requestUser,
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
      await this.templateDataSource.create({ ...restInput, excerpt: restInput.excerpt || '' }, type, requestUser);

    // 新建（当状态为需要审核）审核消息推送
    if (status === TemplateStatus.Pending) {
      await this.messageService.publish({
        excludes: [requestUser.sub!],
        message: {
          eventName: 'createTemplateReview',
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
      type,
      commentStatus,
      commentCount,
      updatedAt,
      createdAt,
    };
  }

  @RamAuthorized(TemplateAction.Update)
  @Mutation((returns) => Boolean, { description: 'Update template (must not be in "trash" status).' })
  async updateTemplate(
    @Args('id', { type: () => ID, description: 'Form id' }) id: number,
    @Args('model', { type: () => UpdateTemplateInput }) model: UpdateTemplateInput,
    @User() requestUser: RequestUser,
  ): Promise<boolean> {
    const result = await this.templateDataSource.update(id, model, requestUser);

    // 修改（当状态为需要审核并且有任何修改）审核消息推送
    if (result && model.status === TemplateStatus.Pending) {
      await this.messageService.publish({
        excludes: [requestUser.sub!],
        message: {
          eventName: 'updateTemplateReview',
          payload: {
            id,
          },
        },
      });
    }
    return result;
  }

  @RamAuthorized(TemplateAction.UpdateStatus)
  @Mutation((returns) => Boolean, {
    description: 'Update template stauts (must not be in "trash" status)',
  })
  updateTemplateStatus(
    @Args('id', { type: () => ID, description: 'Template id' }) id: number,
    @Args('status', { type: () => TemplateStatus, description: 'status' }) status: TemplateStatus,
    @User() requestUser: RequestUser,
  ): Promise<Boolean> {
    return this.templateDataSource.updateStatus(id, status, requestUser);
  }

  @RamAuthorized(TemplateAction.BulkUpdateStatus)
  @Mutation((returns) => Boolean, {
    description: `Update the bulk of templates' status (must not be in "trash" status)`,
  })
  bulkUpdateTemplateStatus(
    @Args('ids', { type: () => [ID!], description: 'Template ids' }) ids: number[],
    @Args('status', { type: () => TemplateStatus, description: 'Status' }) status: TemplateStatus,
    @User() requestUser: RequestUser,
  ): Promise<boolean> {
    return this.templateDataSource.bulkUpdateStatus(ids, status, requestUser);
  }

  @RamAuthorized(TemplateAction.Restore)
  @Mutation((returns) => Boolean, { description: 'Restore template (must be in "trash" status)' })
  restoreTemplate(
    @Args('id', { type: () => ID, description: 'Template id' }) id: number,
    @User() requestUser: RequestUser,
  ): Promise<boolean> {
    return this.templateDataSource.restore(id, requestUser);
  }

  @RamAuthorized(TemplateAction.BulkRestore)
  @Mutation((returns) => Boolean, { description: 'Restore the bulk of templates (must be in "trash" status)' })
  bulkRestoreTemplate(
    @Args('ids', { type: () => [ID!], description: 'Tempalte ids' }) ids: number[],
    @User() requestUser: RequestUser,
  ): Promise<boolean> {
    return this.templateDataSource.bulkRestore(ids, requestUser);
  }

  @RamAuthorized(TemplateAction.Delete)
  @Mutation((returns) => Boolean, {
    description: 'Delete template permanently (must be in "trash" status).',
  })
  deleteTemplate(
    @Args('id', { type: () => ID, description: 'Tempalte id' }) id: number,
    @User() requestUser: RequestUser,
  ) {
    return this.templateDataSource.delete(id, requestUser);
  }

  @RamAuthorized(TemplateAction.BulkDelete)
  @Mutation((returns) => Boolean, {
    description: 'Delete the bulk of templates permanently (must be in "trash" status).',
  })
  bulkDeleteTemplate(
    @Args('ids', { type: () => [ID!], description: 'Tempalte ids' }) ids: number[],
    @User() requestUser: RequestUser,
  ): Promise<boolean> {
    return this.templateDataSource.bulkDelete(ids, requestUser);
  }
}
