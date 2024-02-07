import { ObjectType, Field, ID, Int, PickType, OmitType } from '@nestjs/graphql';
import { ApiSecretModel, ApiSecretsModel } from '@ace-pomelo/identity-datasource';
import { ApiResource } from './api-resource.model';

@ObjectType({ description: 'Api secret model' })
export class ApiSecret implements Omit<ApiSecretModel, 'apiResourceId'> {
  /**
   * Id
   */
  @Field(() => ID)
  id!: number;

  /**
   * Type
   */
  type!: string;

  /**
   * Value
   */
  value!: string;

  /**
   * Expires at
   */
  @Field(() => Int)
  expiresAt?: number;

  /**
   * Description
   */
  description?: string;

  /**
   * Creation time
   */
  createdAt!: Date;
}

@ObjectType({ description: 'Api secret model without value' })
export class ApiSecretWithoutValue extends OmitType(ApiSecret, ['value'] as const) {}

@ObjectType({ description: 'Api secrets model' })
export class ApiSecrets
  extends PickType(ApiResource, ['id', 'name', 'displayName', 'nonEditable'] as const)
  implements Omit<ApiSecretsModel, 'secrets'>
{
  /**
   * Api secrets
   */
  @Field(() => [ApiSecretWithoutValue!]!)
  secrets!: Omit<ApiSecret, 'value'>[];
}
