import { InputType, Field } from '@nestjs/graphql';
import { NewApiPropertyValidator } from './new-api-property.validator';

@InputType({ description: 'New identity resource property input' })
export class NewApiPropertyInput extends NewApiPropertyValidator {
  @Field({ description: 'Property key' })
  key!: string;

  @Field({ description: 'Property value' })
  value!: string;
}
