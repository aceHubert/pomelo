import { Module } from '@nestjs/common';
import { DbInitController } from './db-init.controller';
import { DbInitService } from './db-init.service';

@Module({
  controllers: [DbInitController],
  providers: [DbInitService],
})
export class DbInitModule {}
