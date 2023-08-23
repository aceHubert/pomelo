/**
 * for device type
 */
export enum TemplatePlatform {
  Mobile = 'mobile', // metaKey
  Desktop = 'desktop', // metaKey
  Responsive = 'responsive', // default in template table
}

export interface TemplateMetaAttributes {
  id: number;
  templateId: number;
  metaKey: string;
  metaValue?: string;
}

export interface TemplateMetaMetaCreationAttributes extends Optional<TemplateMetaAttributes, 'id'> {}
