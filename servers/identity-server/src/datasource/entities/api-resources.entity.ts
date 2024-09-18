import { Optional } from './types';

export interface ApiResourcesAttributes {
  id: number;
  name: string;
  displayName?: string;
  description?: string;
  lastAccessed?: Date;
  nonEditable: boolean;
  enabled: boolean;
  updatedAt: Date;
  createdAt: Date;
}

export interface ApiResourcesCreationAttributes extends Optional<ApiResourcesAttributes, 'id'> {}
