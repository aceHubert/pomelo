import DataLoader from 'dataloader';
import { ModuleRef } from '@nestjs/core';
import { Resolver, ResolveField, Query, Mutation, Args, ID, Parent } from '@nestjs/graphql';
import { ResolveTree } from 'graphql-parse-resolve-info';
import { VoidResolver } from 'graphql-scalars';
import { Anonymous, Authorized } from '@ace-pomelo/nestjs-oidc';
import { RamAuthorized } from '@ace-pomelo/ram-authorization';
import { Fields } from '@ace-pomelo/shared-server';
import {
  OptionDataSource,
  TermTaxonomyDataSource,
  TermTaxonomyModel,
  OptionPresetKeys,
  TermPresetTaxonomy,
} from '@ace-pomelo/infrastructure-datasource';
import { createMetaResolver } from '@/common/resolvers/meta.resolver';
import { TermTaxonomyAction } from '@/common/actions';
import { NewTermTaxonomyInput } from './dto/new-term-taxonomy.input';
import { NewTermTaxonomyMetaInput } from './dto/new-term-taxonomy-meta.input';
import { NewTermRelationshipInput } from './dto/new-term-relationship.input';
import { UpdateTermTaxonomyInput } from './dto/update-term-taxonomy.input';
import { TermTaxonomyByObjectIdArgs } from './dto/term-taxonomy-by-object-id.args';
import { TermTaxonomyArgs, CategoryTermTaxonomyArgs, TagTermTaxonomyArgs } from './dto/term-taxonomy.args';
import { TermTaxonomy, TermTaxonomyMeta, TermRelationship } from './models/term-taxonomy.model';

@Authorized()
@Resolver(() => TermTaxonomy)
export class TermTaxonomyResolver extends createMetaResolver(
  TermTaxonomy,
  TermTaxonomyMeta,
  NewTermTaxonomyMetaInput,
  TermTaxonomyDataSource,
  {
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
  },
) {
  private cascadeLoader!: DataLoader<{ parentId: number; fields: string[] }, TermTaxonomyModel[]>;

  constructor(
    protected readonly moduleRef: ModuleRef,
    private readonly termTaxonomyDataSource: TermTaxonomyDataSource,
    private readonly optionDataSource: OptionDataSource,
  ) {
    super(moduleRef);
    this.cascadeLoader = new DataLoader(async (keys) => {
      if (keys.length) {
        // 所有调用的 fields 都是相同的
        const results = await this.termTaxonomyDataSource.getList(
          keys.map((key) => key.parentId),
          keys[0].fields,
        );
        return keys.map(({ parentId }) => results[parentId] || []);
      } else {
        return Promise.resolve([]);
      }
    });
  }

  @Anonymous()
  @Query((returns) => TermTaxonomy, { nullable: true, description: 'Get term taxonomy.' })
  termTaxonomy(
    @Args('id', { type: () => ID, description: 'Term taxonomy id' }) id: number,
    @Fields() fields: ResolveTree,
  ): Promise<TermTaxonomy | undefined> {
    return this.termTaxonomyDataSource.get(id, this.getFieldNames(fields.fieldsByTypeName.TermTaxonomy));
  }

  @RamAuthorized(TermTaxonomyAction.List)
  @Query((returns) => [TermTaxonomy!], { description: 'Get term taxonomy list.' })
  termTaxonomies(@Args() args: TermTaxonomyArgs, @Fields() fields: ResolveTree): Promise<TermTaxonomy[]> {
    return this.termTaxonomyDataSource
      .getList(args, this.getFieldNames(fields.fieldsByTypeName.TermTaxonomy))
      .then((terms) =>
        terms.map((term) =>
          // 级联查询将参数传给 children
          Object.assign(
            {
              taxonomy: args.taxonomy,
              group: args.group,
            },
            term,
          ),
        ),
      );
  }

  @RamAuthorized(TermTaxonomyAction.CategoryList)
  @Query((returns) => [TermTaxonomy!], { description: 'Get category taxonomy list.' })
  async categoryTermTaxonomies(
    @Args() args: CategoryTermTaxonomyArgs,
    @Fields() fields: ResolveTree,
  ): Promise<TermTaxonomy[]> {
    let excludes: number[] | undefined;
    if (args.includeDefault !== true) {
      const defaultCategoryId = await this.optionDataSource.getOptionValue(OptionPresetKeys.DefaultCategory);
      excludes = [Number(defaultCategoryId)];
    }
    return this.termTaxonomyDataSource
      .getList(
        { ...args, excludes, taxonomy: TermPresetTaxonomy.Category },
        this.getFieldNames(fields.fieldsByTypeName.TermTaxonomy),
      )
      .then((terms) =>
        terms.map((term) =>
          // 级联查询将参数传给 children
          Object.assign(
            {
              taxonomy: TermPresetTaxonomy.Category,
              group: args.group,
            },
            term,
          ),
        ),
      );
  }

  @RamAuthorized(TermTaxonomyAction.TagList)
  @Query((returns) => [TermTaxonomy!], { description: 'Get category taxonomy list.' })
  tagTermTaxonomies(@Args() args: TagTermTaxonomyArgs, @Fields() fields: ResolveTree): Promise<TermTaxonomy[]> {
    return this.termTaxonomyDataSource
      .getList({ ...args, taxonomy: TermPresetTaxonomy.Tag }, this.getFieldNames(fields.fieldsByTypeName.TermTaxonomy))
      .then((terms) =>
        terms.map((term) =>
          // 级联查询将参数传给 children
          Object.assign(
            {
              taxonomy: TermPresetTaxonomy.Tag,
              group: args.group,
            },
            term,
          ),
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
  termTaxonomiesByObjectId(
    @Args() args: TermTaxonomyByObjectIdArgs,
    @Fields() fields: ResolveTree,
  ): Promise<TermTaxonomy[]> {
    return this.termTaxonomyDataSource.getListByObjectId(
      args,
      this.getFieldNames(fields.fieldsByTypeName.TermTaxonomy),
    );
  }

  @RamAuthorized(TermTaxonomyAction.Create)
  @Mutation((returns) => TermTaxonomy, { description: 'Create a new term taxonomy.' })
  createTermTaxonomy(
    @Args('model', { type: () => NewTermTaxonomyInput }) model: NewTermTaxonomyInput,
  ): Promise<TermTaxonomy> {
    return this.termTaxonomyDataSource.create(model);
  }

  @RamAuthorized(TermTaxonomyAction.CreateRelationship)
  @Mutation((returns) => TermRelationship, { description: 'Create a new term relationship.' })
  createTermRelationship(
    @Args('model', { type: () => NewTermRelationshipInput }) model: NewTermRelationshipInput,
  ): Promise<TermRelationship> {
    return this.termTaxonomyDataSource.createRelationship(model);
  }

  @RamAuthorized(TermTaxonomyAction.Update)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Update term taxonomy.' })
  async updateTermTaxonomy(
    @Args('id', { type: () => ID, description: 'Term id' }) id: number,
    @Args('model', { type: () => UpdateTermTaxonomyInput }) model: UpdateTermTaxonomyInput,
  ): Promise<void> {
    await this.termTaxonomyDataSource.update(id, model);
  }

  @RamAuthorized(TermTaxonomyAction.Delete)
  @Mutation((returns) => VoidResolver, {
    nullable: true,
    description: 'Delete term taxonomy permanently (include term relationship).',
  })
  async deleteTermTaxonomy(@Args('id', { type: () => ID, description: 'Term id' }) id: number): Promise<void> {
    await this.termTaxonomyDataSource.delete(id);
  }

  @RamAuthorized(TermTaxonomyAction.BulkDelete)
  @Mutation((returns) => VoidResolver, {
    nullable: true,
    description: 'Delete term taxonomies permanently (include term relationship).',
  })
  async bulkDeleteTermTaxonomy(
    @Args('ids', { type: () => [ID!], description: 'Term ids' }) ids: number[],
  ): Promise<void> {
    await this.termTaxonomyDataSource.bulkDelete(ids);
  }

  @RamAuthorized(TermTaxonomyAction.DeleteRelationship)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Delete term relationship permanently.' })
  async deleteTermRelationship(
    @Args('objectId', { type: () => ID, description: 'Object id' }) objectId: number,
    @Args('termTaxonomyId', { type: () => ID, description: 'Term taxonomy id' }) termTaxonomyId: number,
  ): Promise<void> {
    await this.termTaxonomyDataSource.deleteRelationship(objectId, termTaxonomyId);
  }
}
