import DataLoader from 'dataloader';
import { camelCase, lowerCase, upperFirst, words } from 'lodash';
import { ModuleRef } from '@nestjs/core';
import { Type } from '@nestjs/common';
import { Resolver, ResolveField, Query, Mutation, Parent, Args, ID } from '@nestjs/graphql';
import { BaseResolver, Fields } from '@pomelo/shared-server';
import { MetaDataSource } from '@pomelo/datasource';
import { ResolveTree } from 'graphql-parse-resolve-info';
import { RamAuthorized } from '@pomelo/ram-authorization';
import { NewMetaInput } from './dto/new-meta.input';
import { Meta } from './models/meta.model';

export type Options = {
  /**
   * Query/Mutation命名(upper camel case)， 默认值为:  resolverType.name
   * 例如设置为Post,则会命名为 postMetas, createPostMeta, updatePostMeta, deletePostMeta 的Query和Mutation方法
   */
  resolverName?: string;
  /**
   * 对 resolver 描述(lower case). 默认值为: resolverName 或  resolverType.name
   */
  descriptionName?: string;
};

/**
 * 创建 metas ResolverField （分离解决继承问题）
 * DataSources 必须有 getMetas/createMeta/updateMeta/updateMetaByKey/deleteMeta 方法
 */
export function createMetaFieldResolver<
  MetaReturnType,
  NewMetaInputType,
  MetaDataSourceType extends MetaDataSource<MetaReturnType, NewMetaInputType>,
>(
  resolverType: Function,
  metaDataSourceTypeOrToken: Type<MetaDataSourceType> | string | symbol,
  { resolverName, descriptionName }: Options = {},
) {
  const _resolverName = resolverName || resolverType.name;
  const _descriptionName = descriptionName || lowerCase(_resolverName);

  @Resolver(() => resolverType, { isAbstract: true })
  abstract class MetaFieldResolver extends BaseResolver {
    protected metaDataSource!: MetaDataSource<MetaReturnType, NewMetaInputType>;
    private metaLoader!: DataLoader<{ modelId: number; metaKeys?: string[]; fields: string[] }, MetaReturnType[]>;

    constructor(protected readonly moduleRef: ModuleRef) {
      super();
      this.metaDataSource = this.moduleRef.get(metaDataSourceTypeOrToken, { strict: false });
      this.metaLoader = new DataLoader(async (keys) => {
        if (keys.length) {
          // 所有调用的 metaKeys 和 fields 都是相同的
          const results = await this.metaDataSource.getMetas(
            keys.map((key) => key.modelId),
            keys[0].metaKeys ?? 'ALL',
            keys[0].fields,
          );
          return keys.map(({ modelId }) => results[modelId] || []);
        } else {
          return Promise.resolve([]);
        }
      });
    }
    @ResolveField((returns) => [Meta], {
      description: `${_descriptionName} metas.`,
    })
    metas(
      @Parent() { id: modelId }: { id: number },
      @Args('metaKeys', {
        type: () => [String!],
        nullable: true,
        description: 'Meta keys(return all mates if none value is provided)',
      })
      metaKeys: string[] | undefined,
      @Fields() fields: ResolveTree,
    ) {
      return this.metaLoader.load({
        modelId,
        metaKeys,
        fields: this.getFieldNames(fields.fieldsByTypeName.Meta),
      });
      // return this.metaDataSource.getMetas(modelId, metaKeys, this.getFieldNames(fields.fieldsByTypeName.Meta));
    }
  }

  return MetaFieldResolver;
}

/**
 * 创建 meta resolver
 */
export function createMetaResolver<
  MetaReturnType,
  NewMetaInputType,
  MetaDataSourceType extends MetaDataSource<MetaReturnType, NewMetaInputType>,
>(
  resolverType: Function,
  metaReturnType: Type<MetaReturnType>,
  newMetaInputType: Type<NewMetaInputType>,
  metaDataSourceTypeOrToken: Type<MetaDataSourceType> | string | symbol,
  { resolverName, descriptionName }: Options = {},
) {
  const _resolverName = resolverName || resolverType.name;
  const _camelCaseResolverName = camelCase(_resolverName);
  const _upperCamelCaseResolverName = upperFirst(_camelCaseResolverName);
  const _descriptionName = descriptionName || lowerCase(_resolverName);
  const _ramActionPrefix = words(_resolverName).map(lowerCase).join('.');

  @Resolver(() => resolverType, { isAbstract: true })
  abstract class MetaResolver extends createMetaFieldResolver(resolverType, metaDataSourceTypeOrToken, {
    resolverName: _resolverName,
    descriptionName: _descriptionName,
  }) {
    constructor(protected readonly moduleRef: ModuleRef) {
      super(moduleRef);
    }

    /**
     * 获取元数据集合
     *
     */
    @RamAuthorized(`${_ramActionPrefix}.meta.list`)
    @Query((returns) => [metaReturnType!], {
      name: `${_camelCaseResolverName}Metas`,
      description: `Get ${_descriptionName} metas.`,
    })
    getMetas(
      @Args(`${_camelCaseResolverName}Id`, {
        type: () => ID,
        description: `${_descriptionName} Id`,
      })
      modelId: number,
      @Args('metaKeys', {
        type: () => [String!],
        nullable: true,
        description: 'meta keys (return all mates if none value is provided)',
      })
      metaKeys: string[] | undefined,
      @Fields() fields: ResolveTree,
    ) {
      return this.metaDataSource.getMetas(
        modelId,
        metaKeys ?? 'ALL',
        this.getFieldNames(fields.fieldsByTypeName[metaReturnType.name]),
      );
    }

    /**
     * 创建元数据
     */
    @RamAuthorized(`${_ramActionPrefix}.meta.create`)
    @Mutation((returns) => metaReturnType, {
      nullable: true,
      name: `create${_upperCamelCaseResolverName}Meta`,
      description: `Create a new ${_descriptionName} meta.`,
    })
    createMeta(@Args('model', { type: () => newMetaInputType }) model: NewMetaInputType) {
      return this.metaDataSource.createMeta(model);
    }

    /**
     * 批量创建无数据
     */
    @RamAuthorized(`${_ramActionPrefix}.meta.bulk.create`)
    @Mutation((returns) => [metaReturnType!], {
      name: `create${_upperCamelCaseResolverName}Metas`,
      description: `Create the bulk of ${_descriptionName} metas.`,
    })
    createMetas(
      @Args(`${_camelCaseResolverName}id`, {
        type: () => ID,
        description: `${_descriptionName} id`,
      })
      modelId: number,
      @Args('metas', { type: () => [NewMetaInput!] }) models: NewMetaInput[],
    ) {
      return this.metaDataSource.bulkCreateMeta(modelId, models);
    }

    /**
     * 修改元数据
     */
    @RamAuthorized(`${_ramActionPrefix}.meta.update`)
    @Mutation((returns) => Boolean, {
      name: `update${_upperCamelCaseResolverName}Meta`,
      description: `Update ${_descriptionName} meta value.`,
    })
    updateMeta(
      @Args('id', { type: () => ID, description: `${_descriptionName} meta id` })
      id: number,
      @Args('metaValue') metaValue: string,
    ) {
      return this.metaDataSource.updateMeta(id, metaValue);
    }

    /**
     * 根据 metaKey 修改元数据
     */
    @RamAuthorized(`${_ramActionPrefix}.meta.update.bykey`)
    @Mutation((returns) => Boolean, {
      name: `update${_upperCamelCaseResolverName}MetaByKey`,
      description: `Update ${_descriptionName} meta value by meta key.`,
    })
    updateMetaByKey(
      @Args(`${_camelCaseResolverName}Id`, {
        type: () => ID,
        description: `${_descriptionName} Id`,
      })
      modelId: number,
      @Args('metaKey', { description: 'Meta key' }) metaKey: string,
      @Args('metaValue', { description: 'Meta value' }) metaValue: string,
      @Args('createIfNotExists', {
        nullable: true,
        description: 'Create meta if metaKey is not exists, default: false',
      })
      createIfNotExists?: boolean,
    ) {
      return this.metaDataSource.updateMetaByKey(modelId, metaKey, metaValue, createIfNotExists);
    }

    /**
     * 删除元数据
     */
    @RamAuthorized(`${_ramActionPrefix}.meta.delete`)
    @Mutation((returns) => Boolean, {
      name: `delete${_upperCamelCaseResolverName}Meta`,
      description: `Delete ${_descriptionName} meta`,
    })
    deleteMeta(
      @Args('id', { type: () => ID, description: `${_descriptionName} meta Id` })
      id: number,
    ) {
      return this.metaDataSource.deleteMeta(id);
    }

    /**
     * 根据 metaKey 删除元数据
     */
    @RamAuthorized(`${_ramActionPrefix}.meta.delete.bykey`)
    @Mutation((returns) => Boolean, {
      name: `delete${_upperCamelCaseResolverName}MetaByKey`,
      description: `Delete ${_descriptionName} meta by meta key.`,
    })
    deleteMetaByKey(
      @Args(`${_camelCaseResolverName}Id`, {
        type: () => ID,
        description: `${_descriptionName} Id`,
      })
      modelId: number,
      @Args('metaKey', { description: 'Meta key' }) metaKey: string,
    ) {
      return this.metaDataSource.deleteMetaByKey(modelId, metaKey);
    }
  }

  return MetaResolver;
}
