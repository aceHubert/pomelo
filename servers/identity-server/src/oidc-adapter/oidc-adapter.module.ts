import { Module } from '@nestjs/common';
import { OidcRedisAdapterService } from './oidc-redis-adapter.service';

@Module({
  providers: [OidcRedisAdapterService],
  exports: [OidcRedisAdapterService],
})
export class OidcAdapterModule {}
