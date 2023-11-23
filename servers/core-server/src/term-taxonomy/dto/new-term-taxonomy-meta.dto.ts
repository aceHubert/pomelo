import { NewTermTaxonomyMetaInput as INewTermTaxonomyMetaInput } from '@ace-pomelo/datasource';
import { NewMetaDto } from '@/common/controllers/dto/new-meta.dto';

export class NewTermTaxonomyMetaDto extends NewMetaDto implements INewTermTaxonomyMetaInput {
  /**
   * Term taxonomy id
   */
  termTaxonomyId!: number;
}
