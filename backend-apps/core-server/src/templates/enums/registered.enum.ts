import { registerEnumType } from '@nestjs/graphql';
import { TemplatePlatform, TemplateStatus } from '@/orm-entities/interfaces';

registerEnumType(TemplatePlatform, {
  name: 'TemplatePlatform',
  description: 'Template Device type',
});

registerEnumType(TemplateStatus, {
  name: 'TemplateStatus',
  description: 'Template status',
});
