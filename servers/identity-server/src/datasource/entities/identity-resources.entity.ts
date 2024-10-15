import { Optional } from '../shared/types';

export interface IdentityResourcesAttributes {
  id: number;
  name: string;
  displayName?: string;
  description?: string;
  emphasize: boolean;
  required: boolean;
  showInDiscoveryDocument: boolean;
  nonEditable: boolean;
  enabled: boolean;
  updatedAt: Date;
  createdAt: Date;
}

export interface IdentityResourcesCreationAttributes extends Optional<IdentityResourcesAttributes, 'id'> {}
