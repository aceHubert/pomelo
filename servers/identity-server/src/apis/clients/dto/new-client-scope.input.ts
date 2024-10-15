import { InputType } from '@nestjs/graphql';
import { NewClientScopeValidator } from './new-client-scope.validator';

@InputType({ description: 'New client scope input' })
export class NewClientScopeInput extends NewClientScopeValidator {
  /**
   * Scope
   */
  scope!: string;
}
