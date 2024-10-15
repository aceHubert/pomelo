import { Optional } from '../shared/types';

export interface ClientSecretsAttributes {
  id: number;
  clientId: number;
  description?: string;
  expiresAt?: number;
  type: string;
  value: string;
  createdAt: Date;
}

export interface ClientSecretsCreationAttributes extends Optional<ClientSecretsAttributes, 'id'> {}
