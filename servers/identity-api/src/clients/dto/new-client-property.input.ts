import { InputType, Field } from '@nestjs/graphql';
import { NewClientPropertyValidator } from './new-client-property.validator';

@InputType({ description: 'New client property input' })
export class NewClientPropertyInput extends NewClientPropertyValidator {
  @Field({ description: 'Property key' })
  key!: string;

  @Field({ description: 'Property value' })
  value!: string;
}
