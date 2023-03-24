import { ApiResponseProperty } from '@nestjs/swagger';
import { TermRelationshipAttributes } from '@/orm-entities/interfaces';

export class NewTermRelationshipResp implements TermRelationshipAttributes {
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
