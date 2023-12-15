import { ObjectType, Field, ID, PickType } from '@nestjs/graphql';
import { ClientGrantTypeModel, ClientGrantTypesModel } from '@ace-pomelo/identity-datasource';
import { Client } from './cleint.model';

@ObjectType({ description: 'Client grant type model' })
export class ClientGrantType implements Omit<ClientGrantTypeModel, 'clientId'> {
  @Field(() => ID, { description: 'Id' })
  id!: number;

  @Field({ description: 'Grant type' })
  grantType!: string;
}

@ObjectType({ description: 'Client grant types model' })
export class ClientGrantTypes
  extends PickType(Client, ['clientId', 'clientName'] as const)
  implements ClientGrantTypesModel
{
  @Field(() => [ClientGrantType], { description: 'Client grant types' })
  grantTypes!: ClientGrantType[];
}
