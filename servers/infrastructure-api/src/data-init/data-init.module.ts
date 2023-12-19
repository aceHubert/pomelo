import { Module } from '@nestjs/common';
import { DataInitController } from './data-init.controller';
import { DataInitService } from './data-init.service';

@Module({
  controllers: [DataInitController],
  providers: [DataInitService],
})
export class DataInitModule {}
