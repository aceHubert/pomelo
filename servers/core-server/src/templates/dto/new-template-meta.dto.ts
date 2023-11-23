import { NewTemplateMetaInput as INewTemplateMetaInput } from '@ace-pomelo/datasource';
import { NewMetaDto } from '@/common/controllers/dto/new-meta.dto';

export class NewTemplateMetaDto extends NewMetaDto implements INewTemplateMetaInput {
  /**
   * Template Id
   */
  templateId!: number;
}
