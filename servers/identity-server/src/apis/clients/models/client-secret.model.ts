import { ObjectType, Field, ID, Int, PickType, OmitType } from '@nestjs/graphql';
import { ClientSecretModel } from '@/datasource';
import { Client } from './cleint.model';

@ObjectType({ description: 'Client secret model' })
export class ClientSecret implements Omit<ClientSecretModel, 'clientId'> {
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
   * Expires lifetime in seconds from creation time
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

@ObjectType({ description: 'Client secret model without value' })
export class ClientSecretWithoutValue extends OmitType(ClientSecret, ['value'] as const) {}

@ObjectType({ description: 'Client secrets model' })
export class ClientSecrets extends PickType(Client, ['clientId', 'clientName'] as const) {
  /**
   * Client secrets
   */
  @Field(() => [ClientSecretWithoutValue!]!)
  secrets!: Omit<ClientSecret, 'value'>[];
}
