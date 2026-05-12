import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppCacheService } from './cache.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [AppCacheService],
  exports: [AppCacheService],
})
export class AppCacheModule {}
