import { ObjectType, Field, ID, PickType } from '@nestjs/graphql';
import { ApiPropertyModel, ApiPropertiesModel } from '@ace-pomelo/identity-datasource';
import { ApiResource } from './api-resource.model';

@ObjectType({ description: 'Api resource property model' })
export class ApiProperty implements Omit<ApiPropertyModel, 'apiResourceId'> {
  @Field(() => ID, { description: 'Id' })
  id!: number;

  @Field({ description: 'Property key' })
  key!: string;

  @Field({ description: 'Property value' })
  value!: string;
}

@ObjectType({ description: 'Api resource properties model' })
export class ApiProperties
  extends PickType(ApiResource, ['id', 'name', 'displayName', 'nonEditable'] as const)
  implements ApiPropertiesModel
{
  @Field(() => [ApiProperty], { description: 'Api resource properties' })
  properties!: ApiProperty[];
}
