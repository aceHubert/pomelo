import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ApiResourceModel } from '@/datasource';
import { PagedResponse } from '@/common/resolvers/models/paged.model';

@ObjectType({ description: 'Api resource model' })
export class ApiResource implements ApiResourceModel {
  /**
   * Id
   */
  @Field(() => ID)
  id!: number;

  /**
   * Name
   */
  name!: string;

  /**
   * Display name
   */
  displayName?: string;

  /**
   * Description
   */
  description?: string;

  /**
   * Last accessed time
   */
  lastAccessed?: Date;

  /**
   * Non editable
   */
  nonEditable!: boolean;

  /**
   * Enabled
   */
  enabled!: boolean;

  /**
   * Updated at
   */
  updatedAt!: Date;

  /**
   * Created at
   */
  createdAt!: Date;
}

@ObjectType({ description: 'Paged api resource model' })
export class PagedApiResource extends PagedResponse(ApiResource) {}
