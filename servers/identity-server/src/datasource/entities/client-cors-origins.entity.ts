import { Optional } from '../shared/types';

export interface ClientCorsOriginsAttributes {
  id: number;
  clientId: number;
  origin: string;
}

export interface ClientCorsOriginsCreationAttributes extends Optional<ClientCorsOriginsAttributes, 'id'> {}
