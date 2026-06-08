import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { PagedResponse } from '@/common/resolvers/models/paged.model';
import { IdentityResourceModel } from '@/datasource';

@ObjectType({ description: 'Identity resource model' })
export class IdentityResource implements IdentityResourceModel {
  /**
   * Id
   */
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
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

@ObjectType({ description: 'Paged identity resource model' })
export class PagedIdentityResource extends PagedResponse(IdentityResource) {}
