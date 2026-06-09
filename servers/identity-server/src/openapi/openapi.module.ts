import { Module } from '@nestjs/common';
import { ManagementAccountController } from './account/account.controller';
import { ManagementAccountResolver } from './account/account.resolver';
import { ManagementAccountService } from './account/account.service';
import { ManagementApiResourceController } from './api-resources/api-resource.controller';
import { ManagementApiResourceResolver } from './api-resources/api-resource.resolver';
import { ManagementClientController } from './clients/client.controller';
import { ManagementClientResolver } from './clients/client.resolver';
import { ManagementIdentityResourceController } from './identity-resources/identity-resource.controller';
import { ManagementIdentityResourceResolver } from './identity-resources/identity-resource.resolver';

@Module({
  controllers: [
    ManagementAccountController,
    ManagementApiResourceController,
    ManagementClientController,
    ManagementIdentityResourceController,
  ],
  providers: [
    ManagementAccountService,
    ManagementAccountResolver,
    ManagementApiResourceResolver,
    ManagementClientResolver,
    ManagementIdentityResourceResolver,
  ],
})
export class OpenApiModule {}
