import { ObjectType, Field, ID, PickType } from '@nestjs/graphql';
import { IdentityClaimModel, IdentityClaimsModel } from '@/datasource';
import { IdentityResource } from './identity-resource.model';

@ObjectType({ description: 'Identity claim model' })
export class IdentityClaim implements Omit<IdentityClaimModel, 'identityResourceId'> {
  /**
   * Id
   */
  @Field(() => ID)
  id!: number;

  /**
   * Type
   */
  type!: string;
}

@ObjectType({ description: 'Identity claims model' })
export class IdentityClaims
  extends PickType(IdentityResource, ['id', 'name', 'displayName', 'nonEditable'] as const)
  implements IdentityClaimsModel
{
  /**
   * Identity claims
   */
  claims!: IdentityClaim[];
}
