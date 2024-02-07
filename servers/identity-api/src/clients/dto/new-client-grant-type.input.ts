import { InputType } from '@nestjs/graphql';
import { NewClientGrantTypeValidator } from './new-client-grant-type.validator';

@InputType({ description: 'New client grant type input' })
export class NewClientGrantTypeInput extends NewClientGrantTypeValidator {
  /**
   * Grant type
   */
  grantType!: string;
}
