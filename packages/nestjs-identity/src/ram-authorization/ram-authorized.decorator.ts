import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { AUTHORIZATION_RAM_ACTION_KEY } from '../constants';
import { RamAuthorizedGuard } from './ram-authorized.guard';

/**
 * 授权策略验证 (on Method)
 * @param action Action
 */
export function RamAuthorized(action: string): MethodDecorator {
  return applyDecorators(
    SetMetadata(AUTHORIZATION_RAM_ACTION_KEY, action), // 授权策略
    UseGuards(RamAuthorizedGuard), // 使用  ram Ruards
  );
}
