import { ObjectType, Field, ID, PickType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { ClientGrantTypeModel, ClientGrantTypesModel } from '@/datasource';
import { Client } from './cleint.model';

@ObjectType({ description: 'Client grant type model' })
export class ClientGrantType implements Omit<ClientGrantTypeModel, 'clientId'> {
  /**
   * Id
   */
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
  id!: number;

  /**
   * Grant type
   */
  grantType!: string;
}

@ObjectType({ description: 'Client grant types model' })
export class ClientGrantTypes
  extends PickType(Client, ['clientId', 'clientName'] as const)
  implements ClientGrantTypesModel
{
  /**
   * Client grant types
   */
  grantTypes!: ClientGrantType[];
}
