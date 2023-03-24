/**
 * 类别名
 */
export enum Taxonomy {
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

export interface TermTaxonomyCreationAttributes
  extends Optional<TermTaxonomyAttributes, 'id' | 'parentId' | 'group' | 'count'> {}
