import { Optional } from './types';

/**
 * 预设媒体无数据 Key
 */
export enum MediaMetaPresetKeys {
  /**
   * 额外参数
   */
  Matedata = 'mate_data',
}

export interface MediaMetaAttributes {
  id: number;
  mediaId: number;
  metaKey: string;
  metaValue?: string;
}

export interface MediaMetaCreationAttributes extends Optional<MediaMetaAttributes, 'id'> {}
