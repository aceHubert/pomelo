import { InputType } from '@nestjs/graphql';
import { NewApiScopeValidator } from './new-api-scope.validator';

@InputType({ description: 'New api scope input' })
export class NewApiScopeInput extends NewApiScopeValidator {
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
}
