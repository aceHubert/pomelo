import { Optional } from '../shared/types';

export interface ClientGrantTypesAttributes {
  id: number;
  clientId: number;
  grantType: string;
}

export interface ClientGrantTypesCreationAttributes extends Optional<ClientGrantTypesAttributes, 'id'> {}
