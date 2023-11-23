import { Module } from '@nestjs/common';
import { SecurityController } from './security.controller';
import { LoginController } from './login.controller';

@Module({
  controllers: [SecurityController, LoginController],
})
export class AccountModule {}
