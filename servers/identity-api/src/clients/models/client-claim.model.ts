import { ObjectType, Field, ID, PickType } from '@nestjs/graphql';
import { ClientClaimModel, ClientClaimsModel } from '@ace-pomelo/identity-datasource';
import { Client } from './cleint.model';

@ObjectType({ description: 'Client claim model' })
export class ClientClaim implements Omit<ClientClaimModel, 'clientId'> {
  @Field(() => ID, { description: 'Id' })
  id!: number;

  @Field({ description: 'Type' })
  type!: string;

  @Field({ description: 'Value' })
  value!: string;
}

@ObjectType({ description: 'Client claims model' })
export class ClientClaims extends PickType(Client, ['clientId', 'clientName'] as const) implements ClientClaimsModel {
  @Field(() => [ClientClaim], { description: 'Client claims' })
  claims!: ClientClaim[];
}
