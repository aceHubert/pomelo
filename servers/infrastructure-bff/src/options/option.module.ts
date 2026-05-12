import { Module } from '@nestjs/common';
import { OptionController } from './option.controller';
import { OptionResolver } from './option.resolver';
import { OptionService } from './option.service';
import './enums/registered.enum';

@Module({
  controllers: [OptionController],
  providers: [OptionResolver, OptionService],
})
export class OptionModule {}
