import { ApiResponseProperty } from '@nestjs/swagger';
import { MetaModelResp } from '@/common/controllers/resp/meta-model.resp';
import { Taxonomy } from '@/orm-entities/interfaces';

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
  taxonomy!: Taxonomy;

  /**
   * Description
   */
  @ApiResponseProperty()
  description!: string;

  /**
   * Parent taxonomy id (nested taxonomy)
   */
  @ApiResponseProperty()
  parentId!: number;
}

export class TermTaxonomyMetaModelResp extends MetaModelResp {
  /**
   * taxonomy id
   */
  @ApiResponseProperty()
  termTaxonomyId!: number;
}
