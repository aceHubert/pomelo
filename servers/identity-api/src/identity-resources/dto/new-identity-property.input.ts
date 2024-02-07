import { InputType } from '@nestjs/graphql';
import { NewIdentityPropertyValidator } from './new-identity-property.validator';

@InputType({ description: 'New identity resource property input' })
export class NewIdentityPropertyInput extends NewIdentityPropertyValidator {
  /**
   * Property key
   */
  key!: string;

  /**
   * Property value
   */
  value!: string;
}
