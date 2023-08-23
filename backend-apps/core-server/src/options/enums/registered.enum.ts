import { registerEnumType } from '@nestjs/graphql';
import { OptionAutoload } from '@/orm-entities/interfaces/options.interface';

registerEnumType(OptionAutoload, {
  name: 'OptionAutoload',
  description: 'Is option load automatically in application start',
});
