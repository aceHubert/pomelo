import { Type } from '@nestjs/common';
import { ApiProperty, ApiResponseProperty } from '@nestjs/swagger';
import { uuid } from './uuid.util';

export class DescribeType<T extends Type<unknown> | Function | [Function] | string | Record<string, any>> {
  constructor(readonly type: T, private readonly options: { nullable?: boolean; description?: string } = {}) {}

  get nullable() {
    return this.options.nullable;
  }

  get description() {
    return this.options.description;
  }
}

export const describeType = (...p: ConstructorParameters<typeof DescribeType>) => new DescribeType(...p);

/**
 * 创建动态类型
 * @param data Object types
 * @param responseProperty Is ApiResponseProrperty
 * @param name Type name (must be unique)
 */
export function createDynamicType<
  T extends Type<unknown> | Function | [Function] | string | Record<string, any>,
  D extends Record<string, T | DescribeType<T>>,
>(data: D, isResponseProperty = false, name?: string) {
  const fields = Object.keys(data);

  class DynamicClass {}

  // 解决ExtractPropertiesFromType同名被覆盖
  // https://github.com/nestjs/swagger/blob/master/lib/services/schema-object-factory.ts#L206
  Object.defineProperty(DynamicClass, 'name', { value: name || `DynamicClass_${uuid(8)}` });

  fields.forEach((propertyKey) => {
    let type = data[propertyKey];
    let nullable: boolean | undefined, description: string | undefined;
    if (type instanceof DescribeType) {
      nullable = type.nullable;
      description = type.description;
      type = type.type;
    }
    const decoratorFactory = (target: any, key: any) =>
      [
        ApiProperty({
          type,
          nullable,
          description,
        }),
        isResponseProperty && ApiResponseProperty(),
      ]
        .filter(Boolean)
        .forEach((decorator) => (decorator as PropertyDecorator)(target, key));

    decoratorFactory(DynamicClass.prototype, propertyKey);
  });

  return DynamicClass;
}

/**
 * 创建动态返回类型
 * @param data Object types
 * @param name Type name (must be unique)
 */
export function createResponseSuccessType<
  T extends Record<string, Type<unknown> | Function | [Function] | string | Record<string, any>>,
>(data: T, name?: string) {
  class SuccessResponseClass extends createDynamicType(data, true) {
    @ApiProperty({ description: 'Success' })
    @ApiResponseProperty()
    success!: true;
  }

  // 解决ExtractPropertiesFromType同名被覆盖
  // https://github.com/nestjs/swagger/blob/master/lib/services/schema-object-factory.ts#L206
  Object.defineProperty(SuccessResponseClass, 'name', { value: name || `ResponseSuccessClass_${uuid(8)}` });

  return SuccessResponseClass;
}

export class ResponseFaildType {
  @ApiProperty({ default: false, description: 'Faild' })
  @ApiResponseProperty()
  success!: false;

  @ApiProperty({ description: 'Error message' })
  @ApiResponseProperty()
  message!: string;

  @ApiProperty({ description: 'Status code' })
  @ApiResponseProperty()
  statusCode!: number;

  @ApiProperty({ description: 'Timestamp' })
  @ApiResponseProperty()
  timestamp!: string;

  @ApiProperty({ description: 'Request URL' })
  @ApiResponseProperty()
  path!: string;
}
