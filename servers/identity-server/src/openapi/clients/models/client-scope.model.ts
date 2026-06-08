import { ObjectType, Field, ID, PickType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { ClientScopeModel, ClientScopesModel } from '@/datasource';
import { Client } from './cleint.model';

@ObjectType({ description: 'Client scope model' })
export class ClientScope implements Omit<ClientScopeModel, 'clientId'> {
  /**
   * Id
   */
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
  id!: number;

  /**
   * Scope
   */
  scope!: string;
}

@ObjectType({ description: 'Client scopes model' })
export class ClientScopes extends PickType(Client, ['clientId', 'clientName'] as const) implements ClientScopesModel {
  /**
   * Client scopes
   */
  scopes!: ClientScope[];
}
