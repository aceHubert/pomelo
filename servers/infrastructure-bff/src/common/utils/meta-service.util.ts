import { Observable } from 'rxjs';
import { Empty } from '@ace-pomelo/shared/server/proto-ts/google/protobuf/empty';

type addModelId<ModelName extends string> = {
  [K in `${ModelName}Id`]: number;
};

type addModelIds<ModelName extends string> = {
  [K in `${ModelName}Ids`]: {
    value: number[];
  };
};

export type MetaResponse<ModelName extends string> = {
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

export interface MetaServiceClient<ModelName extends string> {
  getMeta(request: GetMetaRequest): Observable<GetMetaResponse<ModelName>>;
  getMetas(request: GetMetasRequest<ModelName>): Observable<GetMetasResponse<ModelName>>;
  createMeta(request: CreateMetaRequest<ModelName>): Observable<CreateMetaResponse<ModelName>>;
  createMetas(request: CreateMetasRequest<ModelName>): Observable<CreateMetasResponse<ModelName>>;
  updateMeta(request: UpdateMetaRequest): Observable<Empty>;
  updateMetaByKey(request: UpdateMetaByKeyRequest<ModelName>): Observable<Empty>;
  deleteMeta(request: DeleteMetaRequest): Observable<Empty>;
  deleteMetaByKey(request: DeleteMetaByKeyRequest<ModelName>): Observable<Empty>;
}
