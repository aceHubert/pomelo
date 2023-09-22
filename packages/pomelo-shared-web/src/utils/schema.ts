import { jsonSafeParse, jsonSerializeReviver, jsonDeserializeReviver } from '@ace-util/core';

export type SchemaFramework = 'FORMILYJS' | 'HTML' | Uppercase<string>;

export const defaultSchemaFramework: SchemaFramework = 'HTML';
export const defaultSchemaSerialize = <S = any>(schema: S): string => {
  return typeof schema === 'string' ? schema : JSON.stringify(schema, jsonSerializeReviver);
};
export const defaultContentDeserialize = <S = any>(content: string): S => {
  return jsonSafeParse(content, jsonDeserializeReviver()) as S;
};

/**
 * 转换为框架模式Schema
 * framework 必须是大写
 * @param schema <FORMILYJS>{content}</FORMILYJS>
 */
export const getFrameworkSchema = <S = any>(
  content: string,
  deserialize: (content: string, framework: SchemaFramework) => S = defaultContentDeserialize,
): { schema: S; framework: SchemaFramework } => {
  if (!content.trim())
    return {
      schema: content as S,
      framework: defaultSchemaFramework,
    };

  const matcher = content.match(/^<([A-Z_-]+)>([\s\S]*)<\/([A-Z_-]+)>$/);
  if (matcher?.length && matcher[1] === matcher[3]) {
    const framework = matcher[1] as SchemaFramework;

    return {
      schema: deserialize(matcher[2], framework),
      framework,
    };
  } else {
    return {
      schema: content as S,
      framework: defaultSchemaFramework,
    };
  }
};

/**
 * 转换为框架格式内容
 * framework 必须是大写
 */
export const toFrameworkContent = <S extends object | string>(
  schema: S,
  framework: SchemaFramework = defaultSchemaFramework,
  serialize: (schema: S, framework: SchemaFramework) => string = defaultSchemaSerialize,
): string => {
  return framework === defaultSchemaFramework
    ? serialize(schema, framework)
    : `<${framework}>${
        typeof schema === 'string' && framework === 'FORMILYJS'
          ? JSON.stringify(schema, jsonSerializeReviver)
          : serialize?.(schema, framework) ?? schema
      }</${framework}>`;
};
