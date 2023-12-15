import { ObjectType, Field, ID, PickType } from '@nestjs/graphql';
import { ApiClaimModel, ApiClaimsModel } from '@ace-pomelo/identity-datasource';
import { ApiResource } from './api-resource.model';

@ObjectType({ description: 'Api claim model' })
export class ApiClaim implements Omit<ApiClaimModel, 'apiResourceId'> {
  @Field(() => ID, { description: 'Id' })
  id!: number;

  @Field({ description: 'Type' })
  type!: string;
}

@ObjectType({ description: 'Api claims model' })
export class ApiClaims
  extends PickType(ApiResource, ['id', 'name', 'displayName', 'nonEditable'] as const)
  implements ApiClaimsModel
{
  @Field(() => [ApiClaim], { description: 'Api claims' })
  claims!: ApiClaim[];
}
