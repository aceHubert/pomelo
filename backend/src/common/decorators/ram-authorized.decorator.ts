import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { RamAuthorizedGuard } from '../guards/ram-authorized.guard';
import { AUTHORIZATION_RAM_ACTION_KEY } from '../constants';
import * as Actions from './ram-actions';

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

export { Actions };
