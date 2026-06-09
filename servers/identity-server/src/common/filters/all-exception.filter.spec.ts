import { describe, expect, it } from '@jest/globals';
import { ArgumentsHost } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { I18nValidationException } from 'nestjs-i18n';
import { AllExceptionFilter } from './all-exception.filter';

describe('AllExceptionFilter', () => {
  it('GraphQL 中将 i18n 校验异常映射为明确的用户输入错误', async () => {
    const filter = new AllExceptionFilter();
    const exception = new I18nValidationException([
      {
        property: 'clientId',
        constraints: {
          isUuid: 'clientId must be a UUID',
        },
      },
    ]);

    const result = await filter.catch(exception, {
      getType: () => 'graphql',
      getArgs: () => [],
    } as unknown as ArgumentsHost);

    expect(result).toBeInstanceOf(GraphQLError);
    expect((result as GraphQLError).message).toBe('clientId must be a UUID');
    expect((result as GraphQLError).extensions).toMatchObject({
      code: 'BAD_REQUEST',
    });
  });
});
