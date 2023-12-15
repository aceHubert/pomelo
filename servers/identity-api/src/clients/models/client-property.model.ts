import { ObjectType, Field, ID, PickType } from '@nestjs/graphql';
import { ClientPropertyModel, ClientPropertiesModel } from '@ace-pomelo/identity-datasource';
import { Client } from './cleint.model';

@ObjectType({ description: 'Client property model' })
export class ClientProperty implements Omit<ClientPropertyModel, 'clientId'> {
  @Field(() => ID, { description: 'Id' })
  id!: number;

  @Field({ description: 'Property key' })
  key!: string;

  @Field({ description: 'Property value' })
  value!: string;
}

@ObjectType({ description: 'Client properties model' })
export class ClientProperties
  extends PickType(Client, ['clientId', 'clientName'] as const)
  implements ClientPropertiesModel
{
  @Field(() => [ClientProperty], { description: 'Client properties' })
  properties!: ClientProperty[];
}
