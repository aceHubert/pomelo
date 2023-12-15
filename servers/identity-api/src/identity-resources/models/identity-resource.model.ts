import { ObjectType, Field, ID } from '@nestjs/graphql';
import { IdentityResourceModel } from '@ace-pomelo/identity-datasource';
import { PagedResponse } from '@/common/resolvers/models/paged.model';

@ObjectType({ description: 'Identity resource model' })
export class IdentityResource implements IdentityResourceModel {
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

  @Field({ description: 'Non editable' })
  nonEditable!: boolean;

  @Field({ description: 'Enabled' })
  enabled!: boolean;

  @Field({ description: 'Updated at' })
  updatedAt!: Date;

  @Field({ description: 'Created at' })
  createdAt!: Date;
}

@ObjectType({ description: 'Paged identity resource model' })
export class PagedIdentityResource extends PagedResponse(IdentityResource) {}
