import { InputType } from '@nestjs/graphql';
import { NewApiScopeClaimValidator } from './new-api-scope-claim.validator';

@InputType({ description: 'New api scope claim input' })
export class NewApiScopeClaimInput extends NewApiScopeClaimValidator {
  /**
   * Claim type
   */
  type!: string;
}
