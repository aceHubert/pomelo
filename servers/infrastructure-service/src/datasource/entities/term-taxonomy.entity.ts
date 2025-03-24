import { Optional } from './types';

/**
 * 预设类别
 */
export enum TermPresetTaxonomy {
  Category = 'category',
  Tag = 'tag',
}

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
