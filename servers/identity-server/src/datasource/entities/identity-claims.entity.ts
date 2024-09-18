import { Optional } from './types';

export interface IdentityClaimsAttributes {
  id: number;
  identityResourceId: number;
  type: string;
}

export interface IdentityClaimsCreationAttributes extends Optional<IdentityClaimsAttributes, 'id'> {}
