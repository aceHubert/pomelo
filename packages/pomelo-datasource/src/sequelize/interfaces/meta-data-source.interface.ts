import { NewMetaInput } from './meta.interface';

export interface MetaDataSource<MetaReturnType, NewMetaInputType> {
  getMeta(id: number, fields: string[]): Promise<MetaReturnType | undefined>;
  getMetaByKey(modelId: number, metaKey: string, fields: string[]): Promise<MetaReturnType | undefined>;
  getMetas(modelId: number, metaKeys: string[] | 'ALL', fields: string[]): Promise<MetaReturnType[]>;
  getMetas(modelId: number[], metaKeys: string[] | 'ALL', fields: string[]): Promise<Record<number, MetaReturnType[]>>;
  isMetaExists(modelId: number, metaKey: string): Promise<boolean>;
  createMeta(model: NewMetaInputType): Promise<MetaReturnType>;
  bulkCreateMeta(modelId: number, models: NewMetaInput[]): Promise<MetaReturnType[]>;
  updateMeta(id: number, metaValue: string): Promise<boolean>;
  updateMetaByKey(modelId: number, metaKey: string, metaValue: string, createIfNotExists?: boolean): Promise<boolean>;
  deleteMeta(id: number): Promise<boolean>;
  deleteMetaByKey(modelId: number, metaKey: string): Promise<boolean>;
}
