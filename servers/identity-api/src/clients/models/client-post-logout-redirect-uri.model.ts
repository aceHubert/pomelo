import { ObjectType, Field, ID, PickType } from '@nestjs/graphql';
import { ClientPostLogoutRedirectUriModel, ClientPostLogoutRedirectUrisModel } from '@ace-pomelo/identity-datasource';
import { Client } from './cleint.model';

@ObjectType({ description: 'Client post logout redirect uri model' })
export class ClientPostLogoutRedirectUri implements Omit<ClientPostLogoutRedirectUriModel, 'clientId'> {
  @Field(() => ID, { description: 'Id' })
  id!: number;

  @Field({ description: 'Redirect uri' })
  postLogoutRedirectUri!: string;
}

@ObjectType({ description: 'Client post logout redirect uris model' })
export class ClientPostLogoutRedirectUris
  extends PickType(Client, ['clientId', 'clientName'] as const)
  implements ClientPostLogoutRedirectUrisModel
{
  @Field(() => [ClientPostLogoutRedirectUri], { description: 'Client post logout redirect uris' })
  postLogoutRedirectUris!: ClientPostLogoutRedirectUri[];
}
