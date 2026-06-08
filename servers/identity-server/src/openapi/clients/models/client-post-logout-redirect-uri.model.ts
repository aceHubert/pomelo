import { ObjectType, Field, ID, PickType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { ClientPostLogoutRedirectUriModel, ClientPostLogoutRedirectUrisModel } from '@/datasource';
import { Client } from './cleint.model';

@ObjectType({ description: 'Client post logout redirect uri model' })
export class ClientPostLogoutRedirectUri implements Omit<ClientPostLogoutRedirectUriModel, 'clientId'> {
  /**
   * Id
   */
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
  id!: number;

  /**
   * Redirect uri
   */
  postLogoutRedirectUri!: string;
}

@ObjectType({ description: 'Client post logout redirect uris model' })
export class ClientPostLogoutRedirectUris
  extends PickType(Client, ['clientId', 'clientName'] as const)
  implements ClientPostLogoutRedirectUrisModel
{
  /**
   * Client post logout redirect uris
   */
  postLogoutRedirectUris!: ClientPostLogoutRedirectUri[];
}
