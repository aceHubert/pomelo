import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { TokenGuard } from '../guards/token.guard';
import { AUTHORIZATION_KEY } from '../oidc.constants';

export function Authorized(): MethodDecorator & ClassDecorator {
  return applyDecorators(
    SetMetadata(AUTHORIZATION_KEY, true), // 验证登录
    UseGuards(TokenGuard), // 使用 Guards
  );
}
