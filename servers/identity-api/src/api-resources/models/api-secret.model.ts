import { ObjectType, Field, ID, Int, PickType, OmitType } from '@nestjs/graphql';
import { ApiSecretModel, ApiSecretsModel } from '@ace-pomelo/identity-datasource';
import { ApiResource } from './api-resource.model';

@ObjectType({ description: 'Api secret model' })
export class ApiSecret implements Omit<ApiSecretModel, 'apiResourceId'> {
  @Field(() => ID, { description: 'Id' })
  id!: number;

  @Field({ description: 'Type' })
  type!: string;

  @Field({ description: 'Value' })
  value!: string;

  @Field(() => Int, { description: 'Expires at ' })
  expiresAt?: number;

  @Field({ description: 'Description' })
  description?: string;

  @Field({ description: 'Creation time' })
  createdAt!: Date;
}

@ObjectType({ description: 'Api secret model without value' })
export class ApiSecretWithoutValue extends OmitType(ApiSecret, ['value'] as const) {}

@ObjectType({ description: 'Api secrets model' })
export class ApiSecrets
  extends PickType(ApiResource, ['id', 'name', 'displayName', 'nonEditable'] as const)
  implements Omit<ApiSecretsModel, 'secrets'>
{
  // secret value will not be exposed
  @Field(() => [ApiSecretWithoutValue], { description: 'Api secrets' })
  secrets!: Omit<ApiSecret, 'value'>[];
}
