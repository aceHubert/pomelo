import { InputType, Field } from '@nestjs/graphql';
import { NewIdentityClaimValidator } from './new-identity-claim.validator';

@InputType({ description: 'New identity claim input' })
export class NewIdentityClaimInput extends NewIdentityClaimValidator {
  @Field({ description: 'Claim type' })
  type!: string;
}
