import { InputType } from '@nestjs/graphql';
import { NewClientPropertyValidator } from './new-client-property.validator';

@InputType({ description: 'New client property input' })
export class NewClientPropertyInput extends NewClientPropertyValidator {
  /**
   * Property key
   */
  key!: string;

  /**
   * Property value
   */
  value!: string;
}
