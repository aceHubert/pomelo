import { Module } from '@nestjs/common';
import { OidcMomeryAdapterService } from './oidc-momery-adapter.service';
import { OidcRedisAdapterService } from './oidc-redis-adapter.service';

@Module({
  providers: [OidcMomeryAdapterService, OidcRedisAdapterService],
  exports: [OidcMomeryAdapterService, OidcRedisAdapterService],
})
export class OidcAdapterModule {}
