import { ObjectType, Field, ID, PickType } from '@nestjs/graphql';
import { ClientRedirectUriModel, ClientRedirectUrisModel } from '@ace-pomelo/identity-datasource';
import { Client } from './cleint.model';

@ObjectType({ description: 'Client redirect uri model' })
export class ClientRedirectUri implements Omit<ClientRedirectUriModel, 'clientId'> {
  @Field(() => ID, { description: 'Id' })
  id!: number;

  @Field({ description: 'Redirect uri' })
  redirectUri!: string;
}

@ObjectType({ description: 'Client redirect uris model' })
export class ClientRedirectUris
  extends PickType(Client, ['clientId', 'clientName'] as const)
  implements ClientRedirectUrisModel
{
  @Field(() => [ClientRedirectUri], { description: 'Client redirect uris' })
  redirectUris!: ClientRedirectUri[];
}
