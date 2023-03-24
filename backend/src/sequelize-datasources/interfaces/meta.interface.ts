export interface MetaModel {
  id: number;
  metaKey: string;
  metaValue?: string;
}

export interface NewMetaInput {
  metaKey: string;
  metaValue?: string;
}
