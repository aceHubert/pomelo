import { InputType, Field } from '@nestjs/graphql';
import { NewIdentityPropertyValidator } from './new-identity-property.validator';

@InputType({ description: 'New identity resource property input' })
export class NewIdentityPropertyInput extends NewIdentityPropertyValidator {
  @Field({ description: 'Property key' })
  key!: string;

  @Field({ description: 'Property value' })
  value!: string;
}
