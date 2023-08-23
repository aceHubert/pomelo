import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphQLResolveInfo } from 'graphql';
import { parseResolveInfo, ResolveTree, FieldsByTypeName, ParseOptions } from 'graphql-parse-resolve-info';
import { SyntaxError } from '@/common/utils/errors.util';

/**
 * graphql fields
 */
const Fields = createParamDecorator(
  (options: ParseOptions, context: ExecutionContext): ResolveTree | FieldsByTypeName | null => {
    const gqlInfo = GqlExecutionContext.create(context).getInfo<GraphQLResolveInfo>();
    const parsedResolveInfoFragment = parseResolveInfo(gqlInfo, options);

    if (!parsedResolveInfoFragment) {
      throw new SyntaxError('Failed to parse resolve info.');
    }

    return parsedResolveInfoFragment;
  },
);

export { Fields, ResolveTree, FieldsByTypeName };
