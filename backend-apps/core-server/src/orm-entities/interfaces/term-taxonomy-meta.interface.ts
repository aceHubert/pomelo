export interface TermTaxonomyMetaAttributes {
  id: number;
  termTaxonomyId: number;
  metaKey: string;
  metaValue?: string;
}

export interface TermTaxonomyMetaCreationAttributes extends Optional<TermTaxonomyMetaAttributes, 'id'> {}
