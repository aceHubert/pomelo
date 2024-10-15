import { NewMetaDto } from '@/common/controllers/dto/new-meta.dto';

export class NewTemplateMetaDto extends NewMetaDto {
  /**
   * Template Id
   */
  templateId!: number;
}
