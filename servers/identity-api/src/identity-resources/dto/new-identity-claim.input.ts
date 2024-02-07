import { InputType } from '@nestjs/graphql';
import { NewIdentityClaimValidator } from './new-identity-claim.validator';

@InputType({ description: 'New identity claim input' })
export class NewIdentityClaimInput extends NewIdentityClaimValidator {
  /**
   * Claim type
   */
  type!: string;
}
