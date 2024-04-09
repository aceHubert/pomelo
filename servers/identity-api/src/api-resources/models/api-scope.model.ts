import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ApiScopeModel } from '@ace-pomelo/identity-datasource';
import { PagedResponse } from '@/common/resolvers/models/paged.model';

@ObjectType({ description: 'Api scope model' })
export class ApiScope implements ApiScopeModel {
  /**
   * Id
   */
  @Field(() => ID)
  id!: number;

  /**
   * Api resource id
   */
  @Field(() => ID)
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
