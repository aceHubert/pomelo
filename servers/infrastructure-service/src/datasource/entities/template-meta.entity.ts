import { Optional } from '../shared/types';

export interface TemplateMetaAttributes {
  id: number;
  templateId: number;
  metaKey: string;
  metaValue?: string;
}

export interface TemplateMetaMetaCreationAttributes extends Optional<TemplateMetaAttributes, 'id'> {}
