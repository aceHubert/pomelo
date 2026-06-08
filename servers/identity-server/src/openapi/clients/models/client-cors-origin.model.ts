import { ObjectType, Field, ID, PickType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { ClientCorsOriginModel, ClientCorsOriginsModel } from '@/datasource';
import { Client } from './cleint.model';

@ObjectType({ description: 'Client corsOrigin model' })
export class ClientCorsOrigin implements Omit<ClientCorsOriginModel, 'clientId'> {
  /**
   * Id
   */
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
  id!: number;

  /**
   * Origin
   */
  origin!: string;
}

@ObjectType({ description: 'Client corsOrigins model' })
export class ClientCorsOrigins
  extends PickType(Client, ['clientId', 'clientName'] as const)
  implements ClientCorsOriginsModel
{
  /**
   * Client corsOrigins
   */
  corsOrigins!: ClientCorsOrigin[];
}
