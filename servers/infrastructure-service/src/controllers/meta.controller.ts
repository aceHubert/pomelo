import { GrpcMethod } from '@nestjs/microservices';
import { Empty } from '@ace-pomelo/shared/server/proto-ts/google/protobuf/empty';
import { MetaDataSource } from '../datasource';

type addModelId<ModelName extends string> = {
  [K in `${ModelName}Id`]: number;
};

type addModelIds<ModelName extends string> = {
  [K in `${ModelName}Ids`]: {
    value: number[];
  };
};

type MetaResponse<ModelName extends string> = {
  id: number;
  metaKey: string;
  metaValue?: string;
} & addModelId<ModelName>;

export type GetMetaRequest = {
  id: number;
  fields: string[];
};

export type GetMetaResponse<ModelName extends string> = {
  meta?: MetaResponse<ModelName>;
};

export type GetMetasRequest<ModelName extends string> = {
  metaKeys: string[];
  fields: string[];
} & Partial<addModelId<ModelName> & addModelIds<ModelName>>;

export type GetMetasResponse<ModelName extends string> = {
  metas: MetaResponse<ModelName>[];
};

export type CreateMetaRequest<ModelName extends string> = {
  metaKey: string;
  metaValue?: string;
} & addModelId<ModelName>;

export type CreateMetaResponse<ModelName extends string> = {
  meta: MetaResponse<ModelName>;
};

export type CreateMetasRequest<ModelName extends string> = {
  metas: {
    metaKey: string;
    metaValue?: string;
  }[];
} & addModelId<ModelName>;

export type CreateMetasResponse<ModelName extends string> = {
  metas: MetaResponse<ModelName>[];
};

export type UpdateMetaRequest = {
  id: number;
  metaValue: string;
};

export type UpdateMetaByKeyRequest<ModelName extends string> = {
  metaKey: string;
  metaValue: string;
  createIfNotExists?: boolean;
} & addModelId<ModelName>;

export type DeleteMetaRequest = {
  id: number;
};

export type DeleteMetaByKeyRequest<ModelName extends string> = {
  metaKey: string;
} & addModelId<ModelName>;

export interface MetaServiceController<ModelName extends string> {
  getMeta(request: GetMetaRequest): Promise<GetMetaResponse<ModelName>>;
  getMetas(request: GetMetasRequest<ModelName>): Promise<GetMetasResponse<ModelName>>;
  createMeta(request: CreateMetaRequest<ModelName>): Promise<CreateMetaResponse<ModelName>>;
  createMetas(request: CreateMetasRequest<ModelName>): Promise<CreateMetasResponse<ModelName>>;
  updateMeta(request: UpdateMetaRequest): Promise<Empty>;
  updateMetaByKey(request: UpdateMetaByKeyRequest<ModelName>): Promise<Empty>;
  deleteMeta(request: DeleteMetaRequest): Promise<Empty>;
  deleteMetaByKey(request: DeleteMetaByKeyRequest<ModelName>): Promise<Empty>;
}

/**
 * 创建 Meta Controller
 */
export function createMetaController<ModelName extends string>(modelName: ModelName, serviceName: string) {
  abstract class MetaController implements MetaServiceController<ModelName> {
    constructor(
      private readonly metaDataSource: MetaDataSource<MetaResponse<ModelName>, CreateMetaRequest<ModelName>>,
    ) {}

    /**
     * 获取元数据
     */
    @GrpcMethod(serviceName, 'getMeta')
    getMeta({ fields, id }: GetMetaRequest): Promise<GetMetaResponse<ModelName>> {
      // fields 默认值为
      if (fields.length === 0) fields = ['id', 'metaKey', 'metaValue'];
      return this.metaDataSource.getMeta(id, fields).then((meta) => {
        return { meta };
      });
    }

    /**
     * 获取元数据集合
     */
    @GrpcMethod(serviceName, 'getMetas')
    getMetas({ fields, metaKeys, ...rest }: GetMetasRequest<ModelName>): Promise<GetMetasResponse<ModelName>> {
      const modelId: number | number[] = (rest as any)[`${modelName}Id`] ?? (rest as any)[`${modelName}Ids`]?.value;
      if (!modelId) return Promise.resolve({ metas: [] });

      // fields 默认值为
      if (fields.length === 0) fields = ['id', 'metaKey', 'metaValue'];

      return this.metaDataSource.getMetas(modelId, metaKeys, fields).then((metas) => {
        return { metas };
      });
    }

    /**
     * 新建元数据
     */
    @GrpcMethod(serviceName, 'createMeta')
    createMeta(request: CreateMetaRequest<ModelName>): Promise<CreateMetaResponse<ModelName>> {
      return this.metaDataSource.createMeta(request).then((meta) => {
        return { meta };
      });
    }

    /**
     * 批量新建元数据
     */
    @GrpcMethod(serviceName, 'createMetas')
    createMetas({ metas, ...rest }: CreateMetasRequest<ModelName>): Promise<CreateMetasResponse<ModelName>> {
      const modelId = (rest as any)[`${modelName}Id`];
      return this.metaDataSource.bulkCreateMeta(modelId, metas).then((metas) => {
        return { metas };
      });
    }

    /**
     * 修改元数据
     */
    @GrpcMethod(serviceName, 'updateMeta')
    updateMeta({ id, metaValue }: UpdateMetaRequest): Promise<Empty> {
      return this.metaDataSource.updateMeta(id, metaValue).then(() => {
        return {};
      });
    }

    /**
     * 根据 metaKey 修改元数据
     */
    @GrpcMethod(serviceName, 'updateMetaByKey')
    updateMetaByKey({
      metaKey,
      metaValue,
      createIfNotExists = false,
      ...rest
    }: UpdateMetaByKeyRequest<ModelName>): Promise<Empty> {
      const modelId = (rest as any)[`${modelName}Id`];
      return this.metaDataSource.updateMetaByKey(modelId, metaKey, metaValue, createIfNotExists).then(() => {
        return {};
      });
    }

    /**
     * 删除元数据
     */
    @GrpcMethod(serviceName, 'deleteMeta')
    deleteMeta({ id }: DeleteMetaRequest): Promise<Empty> {
      return this.metaDataSource.deleteMeta(id).then(() => {
        return {};
      });
    }

    /**
     * 根据 metaKey 添加元数据
     */
    @GrpcMethod(serviceName, 'deleteMetaByKey')
    deleteMetaByKey({ metaKey, ...rest }: DeleteMetaByKeyRequest<ModelName>): Promise<Empty> {
      const modelId = (rest as any)[`${modelName}Id`];
      return this.metaDataSource.deleteMetaByKey(modelId, metaKey).then(() => {
        return {};
      });
    }
  }

  return MetaController;
}
