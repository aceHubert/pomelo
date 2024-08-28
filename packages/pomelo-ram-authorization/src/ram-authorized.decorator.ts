import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { Extensions } from '@nestjs/graphql';
import { TokenGuard } from './token.guard';
import { RAM_AUTHORIZATION_ACTION_KEY } from './constants';

/**
 * 授权策略验证 (on Method)
 * @param action Action
 */
export function RamAuthorized(action: string): MethodDecorator {
  return applyDecorators(
    SetMetadata(RAM_AUTHORIZATION_ACTION_KEY, action), // 授权策略
    UseGuards(TokenGuard), // 使用  ram Guards
  );
}

/**
 * graphql 授权策略验证 Field）
 * Warning: this is not restricted by [Anonymous].
 * @param action Action
 */
export function FieldRamAuthorized(action: string): PropertyDecorator {
  return applyDecorators(
    Extensions({
      action, // 授权策略
    }),
    UseGuards(TokenGuard), // 使用  ram Guards
  );
}
