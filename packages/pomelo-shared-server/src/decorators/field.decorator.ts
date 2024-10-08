import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphQLResolveInfo } from 'graphql';
import { parseResolveInfo, ResolveTree, FieldsByTypeName, ParseOptions } from 'graphql-parse-resolve-info';

/**
 * graphql fields
 */
export const Fields = createParamDecorator(
  (options: ParseOptions, context: ExecutionContext): ResolveTree | FieldsByTypeName | null => {
    const gqlInfo = GqlExecutionContext.create(context).getInfo<GraphQLResolveInfo>();
    const parsedResolveInfoFragment = parseResolveInfo(gqlInfo, options);

    if (!parsedResolveInfoFragment) {
      throw new BadRequestException('Failed to parse resolve info.');
    }

    return parsedResolveInfoFragment;
  },
);
