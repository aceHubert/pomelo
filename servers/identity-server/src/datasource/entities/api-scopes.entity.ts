import { Optional } from '../types';

export interface ApiScopesAttributes {
  id: number;
  apiResourceId: number;
  name: string;
  displayName?: string;
  description?: string;
  emphasize: boolean;
  required: boolean;
  showInDiscoveryDocument: boolean;
}

export interface ApiScopesCreationAttributes extends Optional<ApiScopesAttributes, 'id'> {}
