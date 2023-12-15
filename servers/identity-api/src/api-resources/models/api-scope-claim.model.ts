import { ObjectType, Field, ID, PickType } from '@nestjs/graphql';
import { ApiScopeClaimModel, ApiScopeClaimsModel } from '@ace-pomelo/identity-datasource';
import { ApiScope } from './api-scope.model';

@ObjectType({ description: 'Api scope claim model' })
export class ApiScopeClaim implements Omit<ApiScopeClaimModel, 'apiScopeId'> {
  @Field(() => ID, { description: 'Id' })
  id!: number;

  @Field({ description: 'Type' })
  type!: string;
}

@ObjectType({ description: 'Api scope claims model' })
export class ApiScopeClaims
  extends PickType(ApiScope, ['id', 'name', 'displayName'] as const)
  implements ApiScopeClaimsModel
{
  @Field(() => [ApiScopeClaim], { description: 'Api scope claims' })
  scopeClaims!: ApiScopeClaim[];
}
