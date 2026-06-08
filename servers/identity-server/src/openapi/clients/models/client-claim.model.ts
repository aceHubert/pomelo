import { ObjectType, Field, ID, PickType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { ClientClaimModel, ClientClaimsModel } from '@/datasource';
import { Client } from './cleint.model';

@ObjectType({ description: 'Client claim model' })
export class ClientClaim implements Omit<ClientClaimModel, 'clientId'> {
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

  /**
   * Value
   */
  value!: string;
}

@ObjectType({ description: 'Client claims model' })
export class ClientClaims extends PickType(Client, ['clientId', 'clientName'] as const) implements ClientClaimsModel {
  /**
   * Client claims
   */
  claims!: ClientClaim[];
}
