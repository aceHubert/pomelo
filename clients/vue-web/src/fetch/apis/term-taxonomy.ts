export enum PresetTaxonomy {
  Category = 'Category',
  Tag = 'Tag',
}

export type TermTaxonomyModel = {
  id: string;
  name: string;
  slug: string;
  taxonomy: PresetTaxonomy | string;
  description: string;
  parentId: string;
  group: number;
  count: number;
};
