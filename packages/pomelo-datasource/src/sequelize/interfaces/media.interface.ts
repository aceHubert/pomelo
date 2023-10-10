import { MediaAttributes, MediaCreationAttributes } from '../../entities';
import { PagedArgs, Paged } from './paged.interface';
import { MetaModel, NewMetaInput } from './meta.interface';

export interface ImageScaleModel {
  width: number;
  height: number;
  path: string;
  name: string;
}

export type MediaMetaDataModel = {
  fileSize: number;
  width?: number;
  height?: number;
  imageScales?: ImageScaleModel[];
  [key: string]: any;
};

export interface MediaModel extends MediaAttributes {
  metaData?: MediaMetaDataModel;
}

export interface MediaMetaModel extends MetaModel {
  mediaId: number;
}

export interface PagedMediaArgs extends PagedArgs {
  /**
   * 根据 filename 模糊查询
   */
  keyword?: string;
  extensions?: string[];
  mimeTypes?: string[];
}

export interface PagedMediaModel extends Paged<MediaModel> {}

export interface NewMediaInput
  extends Pick<MediaCreationAttributes, 'fileName' | 'originalFileName' | 'extension' | 'mimeType' | 'path'> {
  /**
   * metas
   * metaKey 不可以重复
   */
  metas?: NewMetaInput[];
}

export interface UpdateMediaInput
  extends Partial<Pick<NewMediaInput, 'fileName' | 'originalFileName' | 'extension' | 'mimeType' | 'path'>> {}

export interface NewMediaMetaInput extends NewMetaInput {
  mediaId: number;
}
