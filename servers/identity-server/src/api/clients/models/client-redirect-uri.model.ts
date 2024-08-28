import { ObjectType, Field, ID, PickType } from '@nestjs/graphql';
import { ClientRedirectUriModel, ClientRedirectUrisModel } from '@/datasource';
import { Client } from './cleint.model';

@ObjectType({ description: 'Client redirect uri model' })
export class ClientRedirectUri implements Omit<ClientRedirectUriModel, 'clientId'> {
  /**
   * Id
   */
  @Field(() => ID)
  id!: number;

  /**
   * Redirect uri
   */
  redirectUri!: string;
}

@ObjectType({ description: 'Client redirect uris model' })
export class ClientRedirectUris
  extends PickType(Client, ['clientId', 'clientName'] as const)
  implements ClientRedirectUrisModel
{
  /**
   * Client redirect uris
   */
  redirectUris!: ClientRedirectUri[];
}
