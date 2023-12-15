import { ObjectType, Field, ID, PickType } from '@nestjs/graphql';
import { ClientScopeModel, ClientScopesModel } from '@ace-pomelo/identity-datasource';
import { Client } from './cleint.model';

@ObjectType({ description: 'Client scope model' })
export class ClientScope implements Omit<ClientScopeModel, 'clientId'> {
  @Field(() => ID, { description: 'Id' })
  id!: number;

  @Field({ description: 'Scope' })
  scope!: string;
}

@ObjectType({ description: 'Client scopes model' })
export class ClientScopes extends PickType(Client, ['clientId', 'clientName'] as const) implements ClientScopesModel {
  @Field(() => [ClientScope], { description: 'Client scopes' })
  scopes!: ClientScope[];
}
