import DataLoader from 'dataloader';
import { camelCase, lowerCase, upperFirst } from 'lodash';
import { ModuleRef } from '@nestjs/core';
import { Type, applyDecorators } from '@nestjs/common';
import { Resolver, ResolveField, Query, Mutation, Parent, Args, ID } from '@nestjs/graphql';
import { BaseResolver, Fields } from '@ace-pomelo/shared-server';
import { MetaDataSource } from '@ace-pomelo/datasource';
import { ResolveTree } from 'graphql-parse-resolve-info';
import { NewMetaInput } from './dto/new-meta.input';
import { Meta } from './models/meta.model';

export type Method =
  | 'getMeta'
  | 'getMetas'
  | 'fieldMetas'
  | 'createMeta'
  | 'createMetas'
  | 'updateMeta'
  | 'updateMetaByKey'
  | 'deleteMeta'
  | 'deleteMetaByKey';

export type Options = {
  /**
   * Query/Mutation prefix (upper camel case).
   * @default camelCase(resolverType.name)
   * @example resolverType is Post, then will expose postMetas, createPostMeta, updatePostMeta, deletePostMeta, etc... methods
   */
  resolverName?: string;
  /**
   * description model name for resolver (lower case).
   * @default lowerCase(resolverName)
   * @example Get media(descriptionName) metas.
   */
  descriptionName?: string;
  /**
   * authorize decorator(s)
   */
  authDecorator?: (method: Method) => MethodDecorator | MethodDecorator[];
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
  {
    resolverName,
    descriptionName,
    authDecorator,
  }: Omit<Options, 'authDecorator'> & {
    authDecorator?: () => MethodDecorator | MethodDecorator[];
  },
) {
  const _resolverName = resolverName || resolverType.name;
  const _descriptionName = descriptionName || lowerCase(_resolverName);

  const AuthDecorate = (): MethodDecorator => {
    if (authDecorator) {
      const decorators = authDecorator();
      return Array.isArray(decorators) ? applyDecorators(...decorators) : decorators;
    } else {
      return (() => {}) as MethodDecorator;
    }
  };

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

    @AuthDecorate()
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
  { resolverName, descriptionName, authDecorator }: Options = {},
) {
  const _resolverName = resolverName || resolverType.name;
  const _camelCaseResolverName = camelCase(_resolverName);
  const _upperCamelCaseResolverName = upperFirst(_camelCaseResolverName);
  const _descriptionName = descriptionName || lowerCase(_resolverName);

  const AuthDecorate = (method: Method): MethodDecorator => {
    if (authDecorator) {
      const decorators = authDecorator(method);
      return Array.isArray(decorators) ? applyDecorators(...decorators) : decorators;
    } else {
      return (() => {}) as MethodDecorator;
    }
  };

  @Resolver(() => resolverType, { isAbstract: true })
  abstract class MetaResolver extends createMetaFieldResolver(resolverType, metaDataSourceTypeOrToken, {
    resolverName: _resolverName,
    descriptionName: _descriptionName,
    authDecorator: () => AuthDecorate('fieldMetas'),
  }) {
    constructor(protected readonly moduleRef: ModuleRef) {
      super(moduleRef);
    }

    /**
     * 获取元数据
     */
    @AuthDecorate('getMeta')
    @Query((returns) => metaReturnType, {
      nullable: true,
      name: `${_camelCaseResolverName}Meta`,
      description: `Get ${_descriptionName} meta.`,
    })
    getMeta(
      @Args('id', {
        type: () => ID,
        description: 'meta Id',
      })
      id: number,
      @Fields() fields: ResolveTree,
    ) {
      return this.metaDataSource.getMeta(id, this.getFieldNames(fields.fieldsByTypeName[metaReturnType.name]));
    }

    /**
     * 获取元数据集合
     */
    @AuthDecorate('getMetas')
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
    @AuthDecorate('createMeta')
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
    @AuthDecorate('createMetas')
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
    @AuthDecorate('updateMeta')
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
    @AuthDecorate('updateMetaByKey')
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
    @AuthDecorate('deleteMeta')
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
    @AuthDecorate('deleteMetaByKey')
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
