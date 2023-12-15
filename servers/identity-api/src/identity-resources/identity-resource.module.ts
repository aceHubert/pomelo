import { Module } from '@nestjs/common';
// import { IdentityResourceController } from './identity-resource.controller';
import { IdentityResourceResolver } from './identity-resource.resolver';

@Module({
  // controllers: [IdentityResourceController],
  providers: [IdentityResourceResolver],
})
export class IdentityResourceModule {}
