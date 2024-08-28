import { Module } from '@nestjs/common';
// import { ApiResourceController } from './api-resources/api-resource.controller';
import { ApiResourceResolver } from './api-resources/api-resource.resolver';
// import { ClientController } from './clients/client.controller';
import { ClientResolver } from './clients/client.resolver';
// import { IdentityResourceController } from './identity-resources/identity-resource.controller';
import { IdentityResourceResolver } from './identity-resources/identity-resource.resolver';

@Module({
  // controllers: [ApiResourceController, ClientController, IdentityResourceController],
  providers: [ApiResourceResolver, ClientResolver, IdentityResourceResolver],
})
export class ApiModule {}
