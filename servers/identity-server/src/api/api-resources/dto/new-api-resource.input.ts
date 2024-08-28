import { InputType } from '@nestjs/graphql';
import { NewApiResourceValidator } from './new-api-resource.validator';

@InputType({ description: 'New client input' })
export class NewApiResourceInput extends NewApiResourceValidator {
  /**
   * Name
   */
  name!: string;

  /**
   * Display name
   */
  displayName?: string;

  /**
   * Description
   */
  description?: string;

  /**
   * Non editable
   */
  nonEditable?: boolean;

  /**
   * Enabled
   */
  enabled?: boolean;
}
