import { ObjectType, Field, ID, PickType } from '@nestjs/graphql';
import { IdentityPropertyModel, IdentityPropertiesModel } from '@ace-pomelo/identity-datasource';
import { IdentityResource } from './identity-resource.model';

@ObjectType({ description: 'Identity resource property model' })
export class IdentityProperty implements Omit<IdentityPropertyModel, 'identityResourceId'> {
  /**
   * Id
   */
  @Field(() => ID)
  id!: number;

  /**
   * Property key
   */
  key!: string;

  /**
   * Property value
   */
  value!: string;
}

@ObjectType({ description: 'Identity resource properties model' })
export class IdentityProperties
  extends PickType(IdentityResource, ['id', 'name', 'displayName', 'nonEditable'] as const)
  implements IdentityPropertiesModel
{
  /**
   * Identity resource properties
   */
  properties!: IdentityProperty[];
}
