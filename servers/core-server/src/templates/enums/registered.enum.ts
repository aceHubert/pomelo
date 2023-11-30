import { registerEnumType } from '@nestjs/graphql';
import { TemplateStatus, TemplateCommentStatus } from '@ace-pomelo/infrastructure-datasource';

registerEnumType(TemplateStatus, {
  name: 'TemplateStatus',
  description: 'Template status',
  valuesMap: {
    AutoDraft: {
      description:
        'Auto Draft, Operate status only work for inner use, if you want to create a draft, use Draft instead or leave it empty',
    },
    Inherit: {
      description: 'Inherit, Operate status only work for inner use',
    },
  },
});

registerEnumType(TemplateCommentStatus, {
  name: 'TemplateCommentStatus',
  description: 'Comment status',
});
