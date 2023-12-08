import { Optional } from '../types';

export interface ApiPropertiesAttributes {
  id: number;
  apiResourceId: number;
  key: string;
  value: string;
}

export interface ApiPropertiesCreationAttributes extends Optional<ApiPropertiesAttributes, 'id'> {}
