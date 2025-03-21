import { Optional } from '../shared/types';

export interface ApiClaimsAttributes {
  id: number;
  apiResourceId: number;
  type: string;
}

export interface ApiClaimsCreationAttributes extends Optional<ApiClaimsAttributes, 'id'> {}
