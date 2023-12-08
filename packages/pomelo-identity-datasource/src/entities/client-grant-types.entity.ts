import { Optional } from '../types';

export interface ClientGrantTypesAttributes {
  id: number;
  clientId: number;
  grantType: string;
}

export interface ClientGrantTypesCreationAttributes extends Optional<ClientGrantTypesAttributes, 'id'> {}
