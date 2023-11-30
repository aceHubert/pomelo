import { Optional } from '../types';

export interface MediaMetaAttributes {
  id: number;
  mediaId: number;
  metaKey: string;
  metaValue?: string;
}

export interface MediaMetaCreationAttributes extends Optional<MediaMetaAttributes, 'id'> {}
