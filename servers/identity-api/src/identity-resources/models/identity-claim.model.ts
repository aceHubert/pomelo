import { ObjectType, Field, ID, PickType } from '@nestjs/graphql';
import { IdentityClaimModel, IdentityClaimsModel } from '@ace-pomelo/identity-datasource';
import { IdentityResource } from './identity-resource.model';

@ObjectType({ description: 'Identity claim model' })
export class IdentityClaim implements Omit<IdentityClaimModel, 'identityResourceId'> {
  @Field(() => ID, { description: 'Id' })
  id!: number;

  @Field({ description: 'Type' })
  type!: string;
}

@ObjectType({ description: 'Identity claims model' })
export class IdentityClaims
  extends PickType(IdentityResource, ['id', 'name', 'displayName', 'nonEditable'] as const)
  implements IdentityClaimsModel
{
  @Field(() => [IdentityClaim], { description: 'Identity claims' })
  claims!: IdentityClaim[];
}
