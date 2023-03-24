import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBasicAuth,
  ApiCookieAuth,
  ApiOAuth2,
  ApiResponse,
  ApiResponseOptions,
} from '@nestjs/swagger';

/**
 * awagger auth decorator collection
 */
export function ApiAuth(
  type: 'basic' | 'bearer' | 'cookie' | 'oauth2' | MethodDecorator,
  responses?: (HttpStatus | ApiResponseOptions)[],
): MethodDecorator {
  return applyDecorators(
    ...[
      type === 'basic'
        ? ApiBasicAuth()
        : type === 'bearer'
        ? ApiBearerAuth()
        : type === 'cookie'
        ? ApiCookieAuth()
        : type === 'oauth2'
        ? ApiOAuth2([])
        : type,
    ].concat(
      responses
        ? responses.map((options) => ApiResponse(typeof options === 'number' ? { status: options } : options))
        : [],
    ),
  );
}
