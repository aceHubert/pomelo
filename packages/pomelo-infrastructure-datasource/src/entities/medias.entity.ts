import { Optional } from '../types';

export interface MediaAttributes {
  id: number;
  fileName: string;
  originalFileName: string;
  extension: string;
  mimeType: string;
  path: string;
  userId: number;
  createdAt: Date;
}

export interface MediaCreationAttributes extends Optional<MediaAttributes, 'id'> {}
