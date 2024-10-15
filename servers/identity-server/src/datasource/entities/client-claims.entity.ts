import { Optional } from '../shared/types';

export interface ClientClaimsAttributes {
  id: number;
  clientId: number;
  type: string;
  value: string;
}

export interface ClientClaimsCreationAttributes extends Optional<ClientClaimsAttributes, 'id'> {}
