import { Optional } from '../shared/types';

export interface ClientRedirectUrisAttributes {
  id: number;
  clientId: number;
  redirectUri: string;
}

export interface ClientRedirectUrisCreationAttributes extends Optional<ClientRedirectUrisAttributes, 'id'> {}
