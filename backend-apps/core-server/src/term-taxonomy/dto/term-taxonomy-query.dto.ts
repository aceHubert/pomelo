import { OmitType } from '@nestjs/swagger';
import { TermTaxonomyArgsValidator } from './term-taxonomy-args.validator';

export class TermTaxonomyQueryDto extends TermTaxonomyArgsValidator {
  /**
   * Fuzzy search by field "name"
   */
  keyword?: string;

  /**
   * Taxonomy name
   */
  taxonomy!: string;

  /**
   * Parent id
   */
  parentId?: number;

  /**
   * Group id
   */
  group?: number;
}

export class CategoryTermTaxonomyQueryDto extends OmitType(TermTaxonomyQueryDto, ['taxonomy'] as const) {}

export class TagTermTaxonomyQueryDto extends OmitType(TermTaxonomyQueryDto, ['taxonomy', 'parentId'] as const) {}
