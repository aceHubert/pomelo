import { registerEnumType } from '@nestjs/graphql';
import { OptionAutoload } from '@ace-pomelo/shared/server';

registerEnumType(OptionAutoload, {
  name: 'OptionAutoload',
  description: 'Is option load automatically in application start',
});
