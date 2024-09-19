import { Module } from '@nestjs/common';
import { SiteInitController } from './site-init.controller';
import { SiteInitResolver } from './site-init.resolver';

@Module({
  controllers: [SiteInitController],
  providers: [SiteInitResolver],
})
export class SiteInitModule {}
