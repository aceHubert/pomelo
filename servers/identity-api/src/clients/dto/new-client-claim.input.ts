import { InputType, Field } from '@nestjs/graphql';
import { NewClientClaimValidator } from './new-client-claim.validator';

@InputType({ description: 'New client claim input' })
export class NewClientClaimInput extends NewClientClaimValidator {
  @Field({ description: 'Claim type' })
  type!: string;

  @Field({ description: 'Claim value' })
  value!: string;
}
