import { Module } from '@nestjs/common';
import { DiscoveryController } from './discovery.controller';
import { SecurityController } from './security.controller';
import { LoginController } from './login.controller';

@Module({
  controllers: [DiscoveryController, SecurityController, LoginController],
})
export class AccountModule {}
