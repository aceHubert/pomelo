import { InputType } from '@nestjs/graphql';
import { NewApiPropertyValidator } from './new-api-property.validator';

@InputType({ description: 'New identity resource property input' })
export class NewApiPropertyInput extends NewApiPropertyValidator {
  /**
   * Property key
   */
  key!: string;

  /**
   * Property value
   */
  value!: string;
}
