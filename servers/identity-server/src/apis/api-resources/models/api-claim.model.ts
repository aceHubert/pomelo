import { ObjectType, Field, ID, PickType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { ApiClaimModel, ApiClaimsModel } from '@/datasource';
import { ApiResource } from './api-resource.model';

@ObjectType({ description: 'Api claim model' })
export class ApiClaim implements Omit<ApiClaimModel, 'apiResourceId'> {
  /**
   * Id
   */
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
  id!: number;

  /**
   * Type
   */
  type!: string;
}

@ObjectType({ description: 'Api claims model' })
export class ApiClaims
  extends PickType(ApiResource, ['id', 'name', 'displayName', 'nonEditable'] as const)
  implements ApiClaimsModel
{
  /**
   * Api claims
   */
  claims!: ApiClaim[];
}
