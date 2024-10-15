import { Optional } from '../shared/types';

export interface UserMetaAttributes {
  id: number;
  userId: number;
  metaKey: string;
  metaValue?: string;
}

export interface UserMetaCreationAttributes extends Optional<UserMetaAttributes, 'id'> {}
