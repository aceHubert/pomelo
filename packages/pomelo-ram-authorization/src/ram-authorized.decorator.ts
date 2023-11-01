import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { RAM_AUTHORIZATION_ACTION_KEY } from './constants';
import { RamAuthorizedGuard } from './ram-authorized.guard';

/**
 * 授权策略验证 (on Method)
 * @param action Action
 */
export function RamAuthorized(action: string): MethodDecorator {
  return applyDecorators(
    SetMetadata(RAM_AUTHORIZATION_ACTION_KEY, action), // 授权策略
    UseGuards(RamAuthorizedGuard), // 使用  ram Ruards
  );
}
