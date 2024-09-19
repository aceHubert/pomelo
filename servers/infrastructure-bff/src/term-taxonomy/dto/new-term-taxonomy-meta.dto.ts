import { NewMetaDto } from '@/common/controllers/dto/new-meta.dto';

export class NewTermTaxonomyMetaDto extends NewMetaDto {
  /**
   * Term taxonomy id
   */
  termTaxonomyId!: number;
}
