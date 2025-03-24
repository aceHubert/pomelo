import DataLoader from 'dataloader';
import { lowerCase, upperFirst } from 'lodash';
import { Type, applyDecorators, ParseIntPipe } from '@nestjs/common';
import { Resolver, ResolveField, Query, Mutation, Parent, Args, ID } from '@nestjs/graphql';
import { VoidResolver } from 'graphql-scalars';
import { Fields } from '@ace-pomelo/shared/server';
import { ResolveTree } from 'graphql-parse-resolve-info';
import {
  MetaServiceClient,
  MetaResponse,
  GetMetasRequest,
  CreateMetaRequest,
  CreateMetasRequest,
  UpdateMetaByKeyRequest,
  DeleteMetaByKeyRequest,
} from '../utils/meta-service.util';
import { NewMetaInput } from './dto/new-meta.input';
import { Meta } from './models/meta.model';
import { BaseResolver } from './base.resolver';

export type MethodName = keyof MetaServiceClient<any> | 'fieldMetas';

export type Options = {
  /**
   * model name(camelCase),
   * pattern prefix(e.g. termTaxonomy -> termTaxonomy.meta.get),
   * Query/Mutation name prefix(e.g. termTaxonomy -> termTaxonomyMeta)
   * @default camelCase(resolverType.name)
   */
  // modelName?: string;
  /**
   * description model name for resolver (lower case).
   * @default lowerCase(modelName)
   * @example Get media(descriptionName) metas.
   */
  descriptionName?: string;
  /**
   * authorize decorator(s)
   */
  authDecorator?: (method: MethodName) => MethodDecorator | MethodDecorator[];
};

/**
 * use DataLoader to batch load metas field resolver
 * @param modelName Model name
 * @param resolverType Resolver type
 * @param options options
 */
export function createMetaFieldResolver<ModelName extends string>(
  modelName: ModelName,
  resolverType: Function,
  {
    descriptionName,
    authDecorator,
  }: Omit<Options, 'authDecorator'> & {
    authDecorator?: () => MethodDecorator | MethodDecorator[];
  },
) {
  const _descriptionName = descriptionName || lowerCase(modelName);

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
    private metaLoader;

    constructor() {
      super();
      this.metaLoader = this.createMetaLoader();
    }

    protected abstract get metaServiceClient(): MetaServiceClient<ModelName>;

    private createMetaLoader(): DataLoader<
      { modelId: number; metaKeys?: string[]; fields: string[] },
      MetaResponse<ModelName>[]
    > {
      return new DataLoader(async (keys) => {
        if (keys.length) {
          // 所有调用的 metaKeys 和 fields 都是相同的
          const { metas } = await this.metaServiceClient
            .getMetas({
              [`${modelName}Ids`]: keys.map((key) => key.modelId),
              metaKeys: keys[0].metaKeys,
              fields: keys[0].fields,
            } as GetMetasRequest<ModelName>)
            .lastValue();
          return keys.map(({ modelId }) => metas.filter((meta) => meta[`${modelName}Id`] === modelId) || []);
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
export function createMetaResolver<
  ModelName extends string,
  MetaReturnType extends MetaResponse<ModelName>,
  NewMetaInputType extends CreateMetaRequest<ModelName>,
>(
  modelName: ModelName,
  resolverType: Function,
  metaReturnType: Type<MetaReturnType>,
  newMetaInputType: Type<NewMetaInputType>,
  { descriptionName, authDecorator }: Options = {},
) {
  const _upperFirstModelName = upperFirst(modelName);
  const _descriptionName = descriptionName || lowerCase(modelName);

  const AuthDecorate = (method: MethodName): MethodDecorator => {
    if (authDecorator) {
      const decorators = authDecorator(method);
      return Array.isArray(decorators) ? applyDecorators(...decorators) : decorators;
    } else {
      return (() => {}) as MethodDecorator;
    }
  };

  @Resolver({ isAbstract: true })
  abstract class MetaResolver extends createMetaFieldResolver(modelName, resolverType, {
    descriptionName: _descriptionName,
    authDecorator: () => AuthDecorate('fieldMetas'),
  }) {
    constructor() {
      super();
    }

    /**
     * 获取元数据
     */
    @AuthDecorate('getMeta')
    @Query((returns) => metaReturnType, {
      nullable: true,
      name: `${modelName}Meta`,
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
      return this.metaServiceClient
        .getMeta({
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
      name: `${modelName}Metas`,
      description: `Get ${_descriptionName} metas.`,
    })
    getMetas(
      @Args(`${modelName}Id`, {
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
      return this.metaServiceClient
        .getMetas({
          [`${modelName}Id`]: modelId,
          metaKeys,
          fields: this.getFieldNames(fields.fieldsByTypeName[metaReturnType.name]),
        } as GetMetasRequest<ModelName>)
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
      return this.metaServiceClient.createMeta(model).lastValue();
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
      @Args(`${modelName}id`, {
        type: () => ID,
        description: `${_descriptionName} id`,
      })
      modelId: number,
      @Args('metas', { type: () => [NewMetaInput!] }) models: NewMetaInput[],
    ) {
      return this.metaServiceClient
        .createMetas({ [`${modelName}Id`]: modelId, metas: models } as CreateMetasRequest<ModelName>)
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
      await this.metaServiceClient.updateMeta({ id, metaValue }).lastValue();
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
        `${modelName}Id`,
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
      await this.metaServiceClient
        .updateMetaByKey({
          [`${modelName}Id`]: modelId,
          metaKey,
          metaValue,
          createIfNotExists,
        } as UpdateMetaByKeyRequest<ModelName>)
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
      await this.metaServiceClient.deleteMeta({ id }).lastValue();
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
      @Args(`${modelName}Id`, {
        type: () => ID,
        description: `${_descriptionName} Id`,
      })
      modelId: number,
      @Args('metaKey', { description: 'Meta key' }) metaKey: string,
    ): Promise<void> {
      await this.metaServiceClient
        .deleteMetaByKey({ [`${modelName}Id`]: modelId, metaKey } as DeleteMetaByKeyRequest<ModelName>)
        .lastValue();
    }
  }

  return MetaResolver;
}
