import { Module } from '@nestjs/common';
import { OptionController } from './option.controller';
import { OptionResolver } from './option.resolver';
import './enums/registered.enum';

@Module({
  controllers: [OptionController],
  providers: [OptionResolver],
})
export class OptionModule {}
