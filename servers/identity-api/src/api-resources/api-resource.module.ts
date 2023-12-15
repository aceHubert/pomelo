import { Module } from '@nestjs/common';
// import { ApiResourceController } from './api-resource.controller';
import { ApiResourceResolver } from './api-resource.resolver';

@Module({
  // controllers: [ApiResourceController],
  providers: [ApiResourceResolver],
})
export class ApiResourceModule {}
