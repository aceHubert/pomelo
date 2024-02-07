import { InputType } from '@nestjs/graphql';
import { NewClientClaimValidator } from './new-client-claim.validator';

@InputType({ description: 'New client claim input' })
export class NewClientClaimInput extends NewClientClaimValidator {
  /**
   * Claim type
   */
  type!: string;

  /**
   * Claim value
   */
  value!: string;
}
