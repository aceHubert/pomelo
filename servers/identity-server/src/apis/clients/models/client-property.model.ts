import { ObjectType, Field, ID, PickType } from '@nestjs/graphql';
import { ClientPropertyModel, ClientPropertiesModel } from '@/datasource';
import { Client } from './cleint.model';

@ObjectType({ description: 'Client property model' })
export class ClientProperty implements Omit<ClientPropertyModel, 'clientId'> {
  /**
   * Id
   */
  @Field(() => ID)
  id!: number;

  /**
   * Property key
   */
  key!: string;

  /**
   * Property value
   */
  value!: string;
}

@ObjectType({ description: 'Client properties model' })
export class ClientProperties
  extends PickType(Client, ['clientId', 'clientName'] as const)
  implements ClientPropertiesModel
{
  /**
   * Client properties
   */
  properties!: ClientProperty[];
}
