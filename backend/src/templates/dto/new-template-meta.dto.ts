import { NewMetaDto } from '@/common/controllers/dto/new-meta.dto';

// Types
import { NewTemplateMetaInput as INewTemplateMetaInput } from '@/sequelize-datasources/interfaces';

export class NewTemplateMetaDto extends NewMetaDto implements INewTemplateMetaInput {
  /**
   * Template Id
   */
  templateId!: number;
}
