import { Optional } from '../types';

export interface TermRelationshipAttributes {
  objectId: number;
  termTaxonomyId: number;
  order: number;
}

export interface TermRelationshipCreationAttributes extends Optional<TermRelationshipAttributes, 'order'> {}
