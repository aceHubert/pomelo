import { Optional } from '../shared/types';

export interface ClientPostLogoutRedirectUrisAttributes {
  id: number;
  clientId: number;
  postLogoutRedirectUri: string;
}

export interface ClientPostLogoutRedirectUrisCreationAttributes
  extends Optional<ClientPostLogoutRedirectUrisAttributes, 'id'> {}
