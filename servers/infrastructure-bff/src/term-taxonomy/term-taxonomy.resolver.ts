import DataLoader from 'dataloader';
import { Inject, ParseIntPipe, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Resolver, ResolveField, Query, Mutation, Args, ID, Parent } from '@nestjs/graphql';
import { ResolveTree } from 'graphql-parse-resolve-info';
import { VoidResolver } from 'graphql-scalars';
import { Anonymous, Authorized } from '@ace-pomelo/nestjs-authorization';
import { RamAuthorized } from '@ace-pomelo/nestjs-ram-authorization';
import { Fields, OptionPresetKeys, TermPresetTaxonomy, POMELO_SERVICE_PACKAGE_NAME } from '@ace-pomelo/shared/server';
import {
  TermTaxonomyServiceClient,
  TERM_TAXONOMY_SERVICE_NAME,
} from '@ace-pomelo/shared/server/proto-ts/term-taxonomy';
import { OptionServiceClient, OPTION_SERVICE_NAME } from '@ace-pomelo/shared/server/proto-ts/option';
import { TermTaxonomyAction } from '@/common/actions';
import { createMetaResolver } from '@/common/resolvers/meta.resolver';
import { NewTermTaxonomyInput } from './dto/new-term-taxonomy.input';
import { NewTermTaxonomyMetaInput } from './dto/new-term-taxonomy-meta.input';
import { NewTermRelationshipInput } from './dto/new-term-relationship.input';
import { UpdateTermTaxonomyInput } from './dto/update-term-taxonomy.input';
import { TermTaxonomyByObjectIdArgs } from './dto/term-taxonomy-by-object-id.args';
import { TermTaxonomyArgs, CategoryTermTaxonomyArgs, TagTermTaxonomyArgs } from './dto/term-taxonomy.args';
import { TermTaxonomy, TermTaxonomyMeta, TermRelationship } from './models/term-taxonomy.model';

@Authorized()
@Resolver(() => TermTaxonomy)
export class TermTaxonomyResolver
  extends createMetaResolver('termTaxonomy', TermTaxonomy, TermTaxonomyMeta, NewTermTaxonomyMetaInput, {
    authDecorator: (method) => {
      const ramAction =
        method === 'getMeta'
          ? TermTaxonomyAction.MetaDetail
          : method === 'getMetas' || method === 'fieldMetas'
          ? TermTaxonomyAction.MetaList
          : method === 'createMeta' || method === 'createMetas'
          ? TermTaxonomyAction.MetaCreate
          : method === 'updateMeta' || method === 'updateMetaByKey'
          ? TermTaxonomyAction.MetaUpdate
          : TermTaxonomyAction.MetaDelete;

      return method === 'getMeta' || method === 'getMetas'
        ? [RamAuthorized(ramAction), Anonymous()]
        : [RamAuthorized(ramAction)];
    },
  })
  implements OnModuleInit
{
  private termTaxonomyServiceClient!: TermTaxonomyServiceClient;
  private optionServiceClient!: OptionServiceClient;

  constructor(@Inject(POMELO_SERVICE_PACKAGE_NAME) private readonly client: ClientGrpc) {
    super();
  }

  onModuleInit() {
    this.termTaxonomyServiceClient = this.client.getService<TermTaxonomyServiceClient>(TERM_TAXONOMY_SERVICE_NAME);
    this.optionServiceClient = this.client.getService<OptionServiceClient>(OPTION_SERVICE_NAME);
  }

  get metaServiceClient() {
    return this.termTaxonomyServiceClient;
  }

  private _cascadeLoader!: DataLoader<{ parentId: number; fields: string[] }, TermTaxonomy[]>;
  get cascadeLoader() {
    return (
      this._cascadeLoader ||
      (this._cascadeLoader = new DataLoader(async (keys) => {
        if (keys.length) {
          // 所有调用的 fields 都是相同的
          const { termTaxonomies } = await this.termTaxonomyServiceClient
            .getListByParentIds({
              parentIds: keys.map((key) => key.parentId),
              fields: keys[0].fields,
            })
            .lastValue();
          return keys.map(({ parentId }) => termTaxonomies.find((item) => item.parentId === parentId)?.value || []);
        } else {
          return Promise.resolve([]);
        }
      }))
    );
  }

  @Anonymous()
  @Query((returns) => TermTaxonomy, { nullable: true, description: 'Get term taxonomy.' })
  async termTaxonomy(
    @Args('id', { type: () => ID, description: 'Term taxonomy id' }, ParseIntPipe) id: number,
    @Fields() fields: ResolveTree,
  ): Promise<TermTaxonomy | undefined> {
    const { termTaxonomy } = await this.termTaxonomyServiceClient
      .get({
        id,
        fields: this.getFieldNames(fields.fieldsByTypeName.TermTaxonomy),
      })
      .lastValue();
    return termTaxonomy || undefined;
  }

  @RamAuthorized(TermTaxonomyAction.List)
  @Query((returns) => [TermTaxonomy!], { description: 'Get term taxonomy list.' })
  async termTaxonomies(@Args() args: TermTaxonomyArgs, @Fields() fields: ResolveTree): Promise<TermTaxonomy[]> {
    const { termTaxonomies } = await this.termTaxonomyServiceClient
      .getList({
        ...args,
        excludes: args.exclude || [],
        fields: this.getFieldNames(fields.fieldsByTypeName.TermTaxonomy),
      })
      .lastValue();
    return termTaxonomies.map((term) =>
      // 级联查询将参数传给 children
      Object.assign(
        {
          taxonomy: args.taxonomy,
          group: args.group,
        },
        term,
      ),
    );
  }

  @RamAuthorized(TermTaxonomyAction.CategoryList)
  @Query((returns) => [TermTaxonomy!], { description: 'Get category taxonomy list.' })
  async categoryTermTaxonomies(
    @Args() args: CategoryTermTaxonomyArgs,
    @Fields() fields: ResolveTree,
  ): Promise<TermTaxonomy[]> {
    let excludes: number[] = [];
    if (args.includeDefault !== true) {
      const { optionValue: defaultCategoryId } = await this.optionServiceClient
        .getValue({
          optionName: OptionPresetKeys.DefaultCategory,
        })
        .lastValue();
      excludes = [Number(defaultCategoryId)];
    }
    const { termTaxonomies } = await this.termTaxonomyServiceClient
      .getList({
        ...args,
        excludes,
        taxonomy: TermPresetTaxonomy.Category,
        fields: this.getFieldNames(fields.fieldsByTypeName.TermTaxonomy),
      })
      .lastValue();
    return termTaxonomies.map((term) =>
      // 级联查询将参数传给 children
      Object.assign(
        {
          taxonomy: TermPresetTaxonomy.Category,
          group: args.group,
        },
        term,
      ),
    );
  }

  @RamAuthorized(TermTaxonomyAction.TagList)
  @Query((returns) => [TermTaxonomy!], { description: 'Get category taxonomy list.' })
  async tagTermTaxonomies(@Args() args: TagTermTaxonomyArgs, @Fields() fields: ResolveTree): Promise<TermTaxonomy[]> {
    const { termTaxonomies } = await this.termTaxonomyServiceClient
      .getList({
        ...args,
        excludes: [],
        taxonomy: TermPresetTaxonomy.Tag,
        fields: this.getFieldNames(fields.fieldsByTypeName.TermTaxonomy),
      })
      .lastValue();
    return termTaxonomies.map((term) =>
      // 级联查询将参数传给 children
      Object.assign(
        {
          taxonomy: TermPresetTaxonomy.Tag,
          group: args.group,
        },
        term,
      ),
    );
  }

  @ResolveField((returns) => [TermTaxonomy!], { description: 'Get cascade term taxonomies.' })
  children(
    @Parent() { taxonomyId: parentId }: { taxonomyId: number },
    @Fields() fields: ResolveTree,
  ): Promise<TermTaxonomy[]> {
    return this.cascadeLoader.load({ parentId, fields: this.getFieldNames(fields.fieldsByTypeName.TermTaxonomy) });
  }

  @RamAuthorized(TermTaxonomyAction.ListByObjectId)
  @Query((returns) => [TermTaxonomy!], { description: 'Get term taxonomies by objectId.' })
  async termTaxonomiesByObjectId(
    @Args() args: TermTaxonomyByObjectIdArgs,
    @Fields() fields: ResolveTree,
  ): Promise<TermTaxonomy[]> {
    const { termTaxonomies } = await this.termTaxonomyServiceClient
      .getListByObjectId({
        ...args,
        fields: this.getFieldNames(fields.fieldsByTypeName.TermTaxonomy),
      })
      .lastValue();
    return termTaxonomies;
  }

  @RamAuthorized(TermTaxonomyAction.Create)
  @Mutation((returns) => TermTaxonomy, { description: 'Create a new term taxonomy.' })
  async createTermTaxonomy(
    @Args('model', { type: () => NewTermTaxonomyInput }) model: NewTermTaxonomyInput,
  ): Promise<TermTaxonomy> {
    const { termTaxonomy } = await this.termTaxonomyServiceClient.create(model).lastValue();
    return termTaxonomy;
  }

  @RamAuthorized(TermTaxonomyAction.CreateRelationship)
  @Mutation((returns) => TermRelationship, { description: 'Create a new term relationship.' })
  async createTermRelationship(
    @Args('model', { type: () => NewTermRelationshipInput }) model: NewTermRelationshipInput,
  ): Promise<TermRelationship> {
    const { relationship } = await this.termTaxonomyServiceClient.createRelationship(model).lastValue();
    return relationship;
  }

  @RamAuthorized(TermTaxonomyAction.Update)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Update term taxonomy.' })
  async updateTermTaxonomy(
    @Args('id', { type: () => ID, description: 'Term id' }, ParseIntPipe) id: number,
    @Args('model', { type: () => UpdateTermTaxonomyInput }) model: UpdateTermTaxonomyInput,
  ): Promise<void> {
    await this.termTaxonomyServiceClient.update({ id, ...model }).lastValue();
  }

  @RamAuthorized(TermTaxonomyAction.Delete)
  @Mutation((returns) => VoidResolver, {
    nullable: true,
    description: 'Delete term taxonomy permanently (include term relationship).',
  })
  async deleteTermTaxonomy(
    @Args('id', { type: () => ID, description: 'Term id' }, ParseIntPipe) id: number,
  ): Promise<void> {
    await this.termTaxonomyServiceClient.delete({ id }).lastValue();
  }

  @RamAuthorized(TermTaxonomyAction.BulkDelete)
  @Mutation((returns) => VoidResolver, {
    nullable: true,
    description: 'Delete term taxonomies permanently (include term relationship).',
  })
  async bulkDeleteTermTaxonomy(
    @Args('ids', { type: () => [ID!], description: 'Term ids' }) ids: number[],
  ): Promise<void> {
    await this.termTaxonomyServiceClient.bulkDelete({ ids }).lastValue();
  }

  @RamAuthorized(TermTaxonomyAction.DeleteRelationship)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Delete term relationship permanently.' })
  async deleteTermRelationship(
    @Args('objectId', { type: () => ID, description: 'Object id' }) objectId: number,
    @Args('termTaxonomyId', { type: () => ID, description: 'Term taxonomy id' }) termTaxonomyId: number,
  ): Promise<void> {
    await this.termTaxonomyServiceClient
      .deleteRelationship({
        objectId,
        termTaxonomyId,
      })
      .lastValue();
  }
}
