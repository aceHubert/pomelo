import { ObjectType, Field, ID, PickType } from '@nestjs/graphql';
import { ClientScopeModel, ClientScopesModel } from '@/datasource';
import { Client } from './cleint.model';

@ObjectType({ description: 'Client scope model' })
export class ClientScope implements Omit<ClientScopeModel, 'clientId'> {
  /**
   * Id
   */
  @Field(() => ID)
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
