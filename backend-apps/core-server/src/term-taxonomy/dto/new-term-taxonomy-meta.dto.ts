import { NewMetaDto } from '@/common/controllers/dto/new-meta.dto';
import { NewTermTaxonomyMetaInput as INewTermTaxonomyMetaInput } from '@/sequelize-datasources/interfaces';

export class NewTermTaxonomyMetaDto extends NewMetaDto implements INewTermTaxonomyMetaInput {
  /**
   * Term taxonomy id
   */
  termTaxonomyId!: number;
}
