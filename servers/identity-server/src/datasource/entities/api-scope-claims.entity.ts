import { Optional } from '../shared/types';

export interface ApiScopeClaimsAttributes {
  id: number;
  apiScopeId: number;
  type: string;
}

export interface ApiScopeClaimsCreationAttributes extends Optional<ApiScopeClaimsAttributes, 'id'> {}
