import { Module } from '@nestjs/common';
import { SiteInitController } from './site-init.controller';
import { SiteInitResolver } from './site-init.resolver';
import { SiteInitService } from './site-init.service';

@Module({
  controllers: [SiteInitController],
  providers: [SiteInitResolver, SiteInitService],
})
export class SiteInitModule {}
