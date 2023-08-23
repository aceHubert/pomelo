import { NewMetaInput } from './meta.interface';

export interface MetaDataSource<MetaReturnType, NewMetaInputType> {
  getMeta(id: number, fields: string[]): Promise<MetaReturnType | null>;
  getMetaByKey(modelId: number, metaKey: string, fields: string[]): Promise<MetaReturnType | null>;
  getMetas(modelId: number, metaKeys: string[] | undefined, fields: string[]): Promise<MetaReturnType[]>;
  getMetas(
    modelId: number[],
    metaKeys: string[] | undefined,
    fields: string[],
  ): Promise<Record<number, MetaReturnType[]>>;
  isMetaExists(modelId: number, metaKey: string): Promise<boolean>;
  createMeta(model: NewMetaInputType): Promise<MetaReturnType>;
  bulkCreateMeta(modelId: number, models: NewMetaInput[]): Promise<MetaReturnType[]>;
  updateMeta(id: number, metaValue: string): Promise<boolean>;
  updateMetaByKey(modelId: number, metaKey: string, metaValue: string): Promise<boolean>;
  deleteMeta(id: number): Promise<boolean>;
  deleteMetaByKey(modelId: number, metaKey: string): Promise<boolean>;
}
