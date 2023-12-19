import { Optional } from '../types';

export interface TermTaxonomyAttributes {
  id: number;
  name: string;
  slug: string;
  taxonomy: string;
  description: string;
  parentId: number;
  group: number;
  count: number;
}

export interface TermTaxonomyCreationAttributes extends Optional<TermTaxonomyAttributes, 'id'> {}
