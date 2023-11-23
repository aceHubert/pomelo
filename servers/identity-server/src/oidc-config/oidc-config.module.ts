import { Module } from '@nestjs/common';
import { OidcAdapterModule } from '../oidc-adapter/oidc-adapter.module';
import { OidcConfigService } from './oidc-config.service';

@Module({
  imports: [OidcAdapterModule],
  providers: [OidcConfigService],
  exports: [OidcConfigService],
})
export class OidcConfigModule {}
