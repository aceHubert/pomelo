import { Module } from '@nestjs/common';

const controllers = require.context('./', true, /\.controller\.ts$/);
const resolvers = require.context('./', true, /\.resolver\.ts$/);

@Module({
  controllers: controllers.keys().flatMap((key) => {
    return Object.values(controllers(key));
  }),
  providers: resolvers.keys().flatMap((key) => {
    return Object.values(resolvers(key));
  }),
})
export class ApisModule {}
