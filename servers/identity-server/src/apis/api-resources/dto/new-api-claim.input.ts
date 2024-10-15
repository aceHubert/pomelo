import { InputType } from '@nestjs/graphql';
import { NewApiClaimValidator } from './new-api-claim.validator';

@InputType({ description: 'New identity claim input' })
export class NewApiClaimInput extends NewApiClaimValidator {
  /**
   * Claim type
   */
  type!: string;
}
