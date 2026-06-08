import { ObjectType, Field, ID, PickType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { ClientRedirectUriModel, ClientRedirectUrisModel } from '@/datasource';
import { Client } from './cleint.model';

@ObjectType({ description: 'Client redirect uri model' })
export class ClientRedirectUri implements Omit<ClientRedirectUriModel, 'clientId'> {
  /**
   * Id
   */
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
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
