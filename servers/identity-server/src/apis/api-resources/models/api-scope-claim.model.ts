import { ObjectType, Field, ID, PickType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { ApiScopeClaimModel, ApiScopeClaimsModel } from '@/datasource';
import { ApiScope } from './api-scope.model';

@ObjectType({ description: 'Api scope claim model' })
export class ApiScopeClaim implements Omit<ApiScopeClaimModel, 'apiScopeId'> {
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

@ObjectType({ description: 'Api scope claims model' })
export class ApiScopeClaims
  extends PickType(ApiScope, ['id', 'apiResourceId', 'name', 'displayName'] as const)
  implements ApiScopeClaimsModel
{
  /**
   * Api scope claims
   */
  scopeClaims!: ApiScopeClaim[];
}
