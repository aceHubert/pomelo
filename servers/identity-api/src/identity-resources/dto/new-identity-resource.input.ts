import { InputType } from '@nestjs/graphql';
import { NewIdentityResourceValidator } from './new-identity-resource.validator';

@InputType({ description: 'New client input' })
export class NewIdentityResourceInput extends NewIdentityResourceValidator {
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
   * Emphasize
   */
  emphasize?: boolean;

  /**
   * Required
   */
  required?: boolean;

  /**
   * Show in discovery document
   */
  showInDiscoveryDocument?: boolean;

  /**
   * Non editable
   */
  nonEditable?: boolean;

  /**
   * Enabled
   */
  enabled?: boolean;
}
