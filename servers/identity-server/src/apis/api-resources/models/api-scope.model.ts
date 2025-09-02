import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { ApiScopeModel } from '@/datasource';
import { PagedResponse } from '@/common/resolvers/models/paged.model';

@ObjectType({ description: 'Api scope model' })
export class ApiScope implements ApiScopeModel {
  /**
   * Id
   */
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
  id!: number;

  /**
   * Api resource id
   */
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
  apiResourceId!: number;

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
   * Emphasize
   */
  emphasize!: boolean;

  /**
   * Required
   */
  required!: boolean;

  /**
   * Show in discovery document
   */
  showInDiscoveryDocument!: boolean;
}

@ObjectType({ description: 'Paged api scope model' })
export class PagedApiScope extends PagedResponse(ApiScope) {}
