import { registerEnumType } from '@nestjs/graphql';
import { OptionAutoload } from '@pomelo/datasource';

registerEnumType(OptionAutoload, {
  name: 'OptionAutoload',
  description: 'Is option load automatically in application start',
});
