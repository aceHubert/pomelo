import { Optional } from './types';

export interface ApiSecretsAttributes {
  id: number;
  apiResourceId: number;
  description?: string;
  expiresAt?: number;
  type: string;
  value: string;
  createdAt: Date;
}

export interface ApiSecretsCreationAttributes extends Optional<ApiSecretsAttributes, 'id'> {}
