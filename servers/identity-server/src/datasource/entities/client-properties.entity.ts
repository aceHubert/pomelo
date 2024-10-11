import { Optional } from '../shared/types';

export interface ClientPropertiesAttributes {
  id: number;
  clientId: number;
  key: string;
  value: string;
}

export interface ClientPropertiesCreationAttributes extends Optional<ClientPropertiesAttributes, 'id'> {}
