import { Module } from '@nestjs/common';
import { ApiResourceResolver } from './api-resources/api-resource.resolver';
import { ClientResolver } from './clients/client.resolver';
import { IdentityResourceResolver } from './identity-resources/identity-resource.resolver';

@Module({
  controllers: [],
  providers: [ApiResourceResolver, ClientResolver, IdentityResourceResolver],
})
export class ApisModule {}
