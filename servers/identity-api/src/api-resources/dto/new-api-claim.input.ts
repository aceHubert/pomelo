import { InputType, Field } from '@nestjs/graphql';
import { NewApiClaimValidator } from './new-api-claim.validator';

@InputType({ description: 'New identity claim input' })
export class NewApiClaimInput extends NewApiClaimValidator {
  @Field({ description: 'Claim type' })
  type!: string;
}
