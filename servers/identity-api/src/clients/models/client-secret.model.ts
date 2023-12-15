import { ObjectType, Field, ID, Int, PickType, OmitType } from '@nestjs/graphql';
import { ClientSecretModel } from '@ace-pomelo/identity-datasource';
import { Client } from './cleint.model';

@ObjectType({ description: 'Client secret model' })
export class ClientSecret implements Omit<ClientSecretModel, 'clientId'> {
  @Field(() => ID, { description: 'Id' })
  id!: number;

  @Field({ description: 'Type' })
  type!: string;

  @Field({ description: 'Value' })
  value!: string;

  @Field(() => Int, { description: 'Expires lifetime in seconds from creation time' })
  expiresAt?: number;

  @Field({ description: 'Description' })
  description?: string;

  @Field({ description: 'Creation time' })
  createdAt!: Date;
}

@ObjectType({ description: 'Client secret model without value' })
export class ClientSecretWithoutValue extends OmitType(ClientSecret, ['value'] as const) {}

@ObjectType({ description: 'Client secrets model' })
export class ClientSecrets extends PickType(Client, ['clientId', 'clientName'] as const) {
  @Field(() => [ClientSecretWithoutValue], { description: 'Client secrets' })
  secrets!: Omit<ClientSecret, 'value'>[];
}
