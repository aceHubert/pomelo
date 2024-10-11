import { Optional } from '../shared/types';

export interface ClientScopesAttributes {
  id: number;
  clientId: number;
  scope: string;
}

export interface ClientScopesCreationAttributes extends Optional<ClientScopesAttributes, 'id'> {}
