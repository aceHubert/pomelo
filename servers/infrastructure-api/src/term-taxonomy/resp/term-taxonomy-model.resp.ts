import { ApiResponseProperty } from '@nestjs/swagger';
import { MetaModelResp } from '@/common/controllers/resp/meta-model.resp';

export class TermTaxonomyModelResp {
  /**
   * Taxonomy id
   */
  @ApiResponseProperty()
  id!: number;

  /**
   * Name
   */
  @ApiResponseProperty()
  name!: string;

  /**
   * Alias for name
   */
  @ApiResponseProperty()
  slug!: string;

  /**
   * taxonomy (category, tag, etc...)
   */
  @ApiResponseProperty()
  taxonomy!: string;

  /**
   * Description
   */
  @ApiResponseProperty()
  description!: string;

  /**
   * Parent taxonomy id (nested taxonomy)
   * @default 0
   */
  @ApiResponseProperty()
  parentId!: number;

  /**
   * Group
   * @default 0
   */
  @ApiResponseProperty()
  group!: number;

  /**
   * Count
   * @default 0
   */
  @ApiResponseProperty()
  count!: number;
}

export class TermRelationshipModelResp {
  /**
   * Object id
   */
  @ApiResponseProperty()
  objectId!: number;

  /**
   * Taxonomy id
   */
  @ApiResponseProperty()
  termTaxonomyId!: number;

  /**
   * Order
   */
  @ApiResponseProperty()
  order!: number;
}

export class TermTaxonomyMetaModelResp extends MetaModelResp {
  /**
   * taxonomy id
   */
  @ApiResponseProperty()
  termTaxonomyId!: number;
}
