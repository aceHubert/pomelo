import { Optional } from '../shared/types';

export interface ClientIdPRestrictionsAttributes {
  id: number;
  clientId: number;
  provider: string;
}

export interface ClientIdPRestrictionsCreationAttributes extends Optional<ClientIdPRestrictionsAttributes, 'id'> {}
