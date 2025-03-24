import { NewMetaInput } from './meta.interface';

export interface MetaDataSource<MetaReturnType, NewMetaInputType> {
  getMeta(id: number, fields: string[]): Promise<MetaReturnType | undefined>;
  getMetaByKey(modelId: number, metaKey: string, fields: string[]): Promise<MetaReturnType | undefined>;
  getMetas(
    modelIdOrIds: number | number[],
    metaKeys: string[] | undefined,
    fields: string[],
  ): Promise<MetaReturnType[]>;
  isMetaExists(modelId: number, metaKey: string): Promise<boolean>;
  createMeta(model: NewMetaInputType): Promise<MetaReturnType>;
  bulkCreateMeta(modelId: number, models: NewMetaInput[]): Promise<MetaReturnType[]>;
  updateMeta(id: number, metaValue: string): Promise<void>;
  updateMetaByKey(modelId: number, metaKey: string, metaValue: string, createIfNotExists?: boolean): Promise<void>;
  deleteMeta(id: number): Promise<void>;
  deleteMetaByKey(modelId: number, metaKey: string): Promise<void>;
}
