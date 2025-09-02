import DataLoader from 'dataloader';
import { camelCase, lowerCase, upperFirst } from 'lodash';
import { Type, applyDecorators, ParseIntPipe } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Resolver, ResolveField, Query, Mutation, Parent, Args, ID } from '@nestjs/graphql';
import { VoidResolver } from 'graphql-scalars';
import { Fields, createMetaPattern } from '@ace-pomelo/shared/server';
import { ResolveTree } from 'graphql-parse-resolve-info';
import { NewMetaInput } from './dto/new-meta.input';
import { Meta } from './models/meta.model';
import { BaseResolver } from './base.resolver';

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
   * model name(camelCase),
   * pattern prefix(e.g. termTaxonomy -> termTaxonomy.meta.get),
   * Query/Mutation name prefix(e.g. termTaxonomy -> termTaxonomyMeta)
   * @default camelCase(resolverType.name)
   */
  modelName?: string;
  /**
   * description model name for resolver (lower case).
   * @default lowerCase(modelName)
   * @example Get media(descriptionName) metas.
   */
  descriptionName?: string;
  /**
   * authorize decorator(s)
   */
  authDecorator?: (method: Method) => MethodDecorator | MethodDecorator[];
};

/**
 * use DataLoader to batch load metas field resolver
 * @param resolverType Resolver type
 * @param options options
 */
export function createMetaFieldResolver<MetaReturnType>(
  resolverType: Function,
  {
    modelName,
    descriptionName,
    authDecorator,
  }: Omit<Options, 'authDecorator'> & {
    authDecorator?: () => MethodDecorator | MethodDecorator[];
  },
) {
  const _modelName = modelName || camelCase(resolverType.name);
  const _descriptionName = descriptionName || lowerCase(_modelName);

  const pattern = createMetaPattern(_modelName);

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
    private metaLoader!: DataLoader<{ modelId: number; metaKeys?: string[]; fields: string[] }, MetaReturnType[]>;

    constructor(basicService: ClientProxy) {
      super();
      this.metaLoader = new DataLoader(async (keys) => {
        if (keys.length) {
          // 所有调用的 metaKeys 和 fields 都是相同的
          const results = await basicService
            .send<Record<number, MetaReturnType[]>>(pattern.GetMetas, {
              [`${_modelName}Ids`]: keys.map((key) => key.modelId),
              metaKeys: keys[0].metaKeys,
              fields: keys[0].fields,
            })
            .lastValue();
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
 * create meta resolver
 * @param resolverType Resolver type
 * @param metaReturnType meta return type (Query/Mutation return type)
 * @param newMetaInputType new meta input type (Mutation input type)
 * @param options options
 */
export function createMetaResolver<MetaReturnType, NewMetaInputType>(
  resolverType: Function,
  metaReturnType: Type<MetaReturnType>,
  newMetaInputType: Type<NewMetaInputType>,
  { modelName, descriptionName, authDecorator }: Options = {},
) {
  const _modelName = modelName || camelCase(resolverType.name);
  const _upperFirstModelName = upperFirst(_modelName);
  const _descriptionName = descriptionName || lowerCase(_modelName);

  const pattern = createMetaPattern(_modelName);

  const AuthDecorate = (method: Method): MethodDecorator => {
    if (authDecorator) {
      const decorators = authDecorator(method);
      return Array.isArray(decorators) ? applyDecorators(...decorators) : decorators;
    } else {
      return (() => {}) as MethodDecorator;
    }
  };

  @Resolver({ isAbstract: true })
  abstract class MetaResolver extends createMetaFieldResolver<MetaReturnType>(resolverType, {
    modelName: _modelName,
    descriptionName: _descriptionName,
    authDecorator: () => AuthDecorate('fieldMetas'),
  }) {
    constructor(protected readonly basicService: ClientProxy) {
      super(basicService);
    }

    /**
     * 获取元数据
     */
    @AuthDecorate('getMeta')
    @Query((returns) => metaReturnType, {
      nullable: true,
      name: `${_modelName}Meta`,
      description: `Get ${_descriptionName} meta.`,
    })
    getMeta(
      @Args(
        'id',
        {
          type: () => ID,
          description: 'meta Id',
        },
        ParseIntPipe,
      )
      id: number,
      @Fields() fields: ResolveTree,
    ) {
      return this.basicService
        .send<MetaReturnType | undefined>(pattern.GetMeta, {
          id,
          fields: this.getFieldNames(fields.fieldsByTypeName[metaReturnType.name]),
        })
        .lastValue();
    }

    /**
     * 获取元数据集合
     */
    @AuthDecorate('getMetas')
    @Query((returns) => [metaReturnType!], {
      name: `${_modelName}Metas`,
      description: `Get ${_descriptionName} metas.`,
    })
    getMetas(
      @Args(`${_modelName}Id`, {
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
      return this.basicService
        .send<MetaReturnType[]>(pattern.GetMetas, {
          [`${_modelName}Id`]: modelId,
          metaKeys,
          fields: this.getFieldNames(fields.fieldsByTypeName[metaReturnType.name]),
        })
        .lastValue();
    }

    /**
     * 创建元数据
     */
    @AuthDecorate('createMeta')
    @Mutation((returns) => metaReturnType, {
      nullable: true,
      name: `create${_upperFirstModelName}Meta`,
      description: `Create a new ${_descriptionName} meta.`,
    })
    createMeta(@Args('model', { type: () => newMetaInputType }) model: NewMetaInputType) {
      return this.basicService.send<MetaReturnType>(pattern.CreateMeta, model).lastValue();
    }

    /**
     * 批量创建无数据
     */
    @AuthDecorate('createMetas')
    @Mutation((returns) => [metaReturnType!], {
      name: `create${_upperFirstModelName}Metas`,
      description: `Create the bulk of ${_descriptionName} metas.`,
    })
    createMetas(
      @Args(`${_modelName}id`, {
        type: () => ID,
        description: `${_descriptionName} id`,
      })
      modelId: number,
      @Args('metas', { type: () => [NewMetaInput!] }) models: NewMetaInput[],
    ) {
      return this.basicService
        .send<MetaReturnType[]>(pattern.CreateMetas, {
          [`${_modelName}Id`]: modelId,
          models,
        })
        .lastValue();
    }

    /**
     * 修改元数据
     */
    @AuthDecorate('updateMeta')
    @Mutation((returns) => VoidResolver, {
      nullable: true,
      name: `update${_upperFirstModelName}Meta`,
      description: `Update ${_descriptionName} meta value.`,
    })
    async updateMeta(
      @Args('id', { type: () => ID, description: `${_descriptionName} meta id` }, ParseIntPipe)
      id: number,
      @Args('metaValue') metaValue: string,
    ) {
      await this.basicService
        .send<void>(pattern.UpdateMeta, {
          id,
          metaValue,
        })
        .lastValue();
    }

    /**
     * 根据 metaKey 修改元数据
     */
    @AuthDecorate('updateMetaByKey')
    @Mutation((returns) => VoidResolver, {
      nullable: true,
      name: `update${_upperFirstModelName}MetaByKey`,
      description: `Update ${_descriptionName} meta value by meta key.`,
    })
    async updateMetaByKey(
      @Args(
        `${_modelName}Id`,
        {
          type: () => ID,
          description: `${_descriptionName} Id`,
        },
        ParseIntPipe,
      )
      modelId: number,
      @Args('metaKey', { description: 'Meta key' }) metaKey: string,
      @Args('metaValue', { description: 'Meta value' }) metaValue: string,
      @Args('createIfNotExists', {
        nullable: true,
        description: 'Create meta if metaKey does not exist, default: false',
      })
      createIfNotExists?: boolean,
    ) {
      await this.basicService
        .send<void>(pattern.UpdateMetaByKey, {
          [`${_modelName}Id`]: modelId,
          metaKey,
          metaValue,
          createIfNotExists,
        })
        .lastValue();
    }

    /**
     * 删除元数据
     */
    @AuthDecorate('deleteMeta')
    @Mutation((returns) => VoidResolver, {
      nullable: true,
      name: `delete${_upperFirstModelName}Meta`,
      description: `Delete ${_descriptionName} meta`,
    })
    async deleteMeta(
      @Args('id', { type: () => ID, description: `${_descriptionName} meta Id` }, ParseIntPipe)
      id: number,
    ) {
      await this.basicService.send<void>(pattern.DeleteMeta, { id }).lastValue();
    }

    /**
     * 根据 metaKey 删除元数据
     */
    @AuthDecorate('deleteMetaByKey')
    @Mutation((returns) => VoidResolver, {
      nullable: true,
      name: `delete${_upperFirstModelName}MetaByKey`,
      description: `Delete ${_descriptionName} meta by meta key.`,
    })
    async deleteMetaByKey(
      @Args(`${_modelName}Id`, {
        type: () => ID,
        description: `${_descriptionName} Id`,
      })
      modelId: number,
      @Args('metaKey', { description: 'Meta key' }) metaKey: string,
    ): Promise<void> {
      await this.basicService
        .send<void>(pattern.DeleteMetaByKey, {
          [`${_modelName}Id`]: modelId,
          metaKey,
        })
        .lastValue();
    }
  }

  return MetaResolver;
}
