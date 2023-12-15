import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ApiResourceModel } from '@ace-pomelo/identity-datasource';
import { PagedResponse } from '@/common/resolvers/models/paged.model';

@ObjectType({ description: 'Api resource model' })
export class ApiResource implements ApiResourceModel {
  @Field(() => ID, { description: 'Id' })
  id!: number;

  @Field({ description: 'Name' })
  name!: string;

  @Field({ nullable: true, description: 'Display name' })
  displayName?: string;

  @Field({ nullable: true, description: 'Description' })
  description?: string;

  @Field({ description: 'Last accessed time' })
  lastAccessed?: Date;

  @Field({ description: 'Non editable' })
  nonEditable!: boolean;

  @Field({ description: 'Enabled' })
  enabled!: boolean;

  @Field({ description: 'Updated at' })
  updatedAt!: Date;

  @Field({ description: 'Created at' })
  createdAt!: Date;
}

@ObjectType({ description: 'Paged api resource model' })
export class PagedApiResource extends PagedResponse(ApiResource) {}
