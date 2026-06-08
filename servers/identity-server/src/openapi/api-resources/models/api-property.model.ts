import { ObjectType, Field, ID, PickType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { ApiPropertyModel, ApiPropertiesModel } from '@/datasource';
import { ApiResource } from './api-resource.model';

@ObjectType({ description: 'Api resource property model' })
export class ApiProperty implements Omit<ApiPropertyModel, 'apiResourceId'> {
  /**
   * Id
   */
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
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

@ObjectType({ description: 'Api resource properties model' })
export class ApiProperties
  extends PickType(ApiResource, ['id', 'name', 'displayName', 'nonEditable'] as const)
  implements ApiPropertiesModel
{
  /**
   * Api resource properties
   */
  properties!: ApiProperty[];
}
