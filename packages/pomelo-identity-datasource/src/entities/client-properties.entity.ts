import { Optional } from '../types';

export interface ClientPropertiesAttributes {
  id: number;
  clientId: number;
  key: string;
  value: string;
}

export interface ClientPropertiesCreationAttributes extends Optional<ClientPropertiesAttributes, 'id'> {}
