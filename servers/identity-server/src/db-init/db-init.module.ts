import { Module } from '@nestjs/common';
import { DbInitService } from './db-init.service';

@Module({
  controllers: [],
  providers: [DbInitService],
})
export class DbInitModule {}
