import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ApiScopeModel } from '@ace-pomelo/identity-datasource';
import { PagedResponse } from '@/common/resolvers/models/paged.model';

@ObjectType({ description: 'Api scope model' })
export class ApiScope implements Omit<ApiScopeModel, 'apiResourceId'> {
  @Field(() => ID, { description: 'Id' })
  id!: number;

  @Field({ description: 'Name' })
  name!: string;

  @Field({ nullable: true, description: 'Display name' })
  displayName?: string;

  @Field({ nullable: true, description: 'Description' })
  description?: string;

  @Field({ description: 'Emphasize' })
  emphasize!: boolean;

  @Field({ description: 'Required' })
  required!: boolean;

  @Field({ description: 'Show in discovery document' })
  showInDiscoveryDocument!: boolean;
}

@ObjectType({ description: 'Paged api scope model' })
export class PagedApiScope extends PagedResponse(ApiScope) {}
