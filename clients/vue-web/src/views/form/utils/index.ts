import type { ISchema } from '@formily/vue';

export type IFormilySchema = {
  form?: Record<string, any>;
  schema?: ISchema;
};

export const checkSchemaValid = (schema: IFormilySchema) => {
  return (
    schema.schema &&
    JSON.stringify(schema.schema) !== '{}' &&
    schema.schema.properties &&
    JSON.stringify(schema.schema.properties) !== '{}'
  );
};
