import { Module } from '@nestjs/common';
// import { ClientController } from './client.controller';
import { ClientResolver } from './client.resolver';

@Module({
  // controllers: [ClientController],
  providers: [ClientResolver],
})
export class ClientModule {}
