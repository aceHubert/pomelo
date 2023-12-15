import { ObjectType, Field, ID, PickType } from '@nestjs/graphql';
import { IdentityPropertyModel, IdentityPropertiesModel } from '@ace-pomelo/identity-datasource';
import { IdentityResource } from './identity-resource.model';

@ObjectType({ description: 'Identity resource property model' })
export class IdentityProperty implements Omit<IdentityPropertyModel, 'identityResourceId'> {
  @Field(() => ID, { description: 'Id' })
  id!: number;

  @Field({ description: 'Property key' })
  key!: string;

  @Field({ description: 'Property value' })
  value!: string;
}

@ObjectType({ description: 'Identity resource properties model' })
export class IdentityProperties
  extends PickType(IdentityResource, ['id', 'name', 'displayName', 'nonEditable'] as const)
  implements IdentityPropertiesModel
{
  @Field(() => [IdentityProperty], { description: 'Identity resource properties' })
  properties!: IdentityProperty[];
}
