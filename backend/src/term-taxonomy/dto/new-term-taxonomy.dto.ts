import { NewTermTaxonomyValidator } from './new-term-taxonomy.validator';

export class NewTermTaxonomyDto extends NewTermTaxonomyValidator {
  /**
   * Term name
   */
  name!: string;

  /**
   * Alias for name, it will set as "name" value if null
   */
  slug?: string;

  /**
   * Taxonomy (category, tag, etc...)
   * @example category
   */
  taxonomy!: string;

  /**
   * Description for taxonomy
   */
  description!: string;

  /**
   * Parent id (nested taxonomy)
   */
  parentId?: number;

  /**
   * Group id
   */
  group?: number;

  /**
   * Object id (Form，Page, etc...), it will define the relationship if value is setted
   */
  objectId?: number;
}
