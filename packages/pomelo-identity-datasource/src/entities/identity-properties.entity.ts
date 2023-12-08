import { Optional } from '../types';

export interface IdentityPropertiesAttributes {
  id: number;
  identityResourceId: number;
  key: string;
  value: string;
}

export interface IdentityPropertiesCreationAttributes extends Optional<IdentityPropertiesAttributes, 'id'> {}
