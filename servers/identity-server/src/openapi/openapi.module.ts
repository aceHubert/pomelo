import { Module, Provider } from '@nestjs/common';

const controllers = require.context('./', true, /\.controller\.ts$/);
const resolvers = require.context('./', true, /\.resolver\.ts$/);
const services = require.context('./', true, /\.service\.ts$/);

@Module({
  controllers: controllers.keys().flatMap((key) => {
    return Object.values(controllers(key));
  }),
  providers: [
    ...services.keys().flatMap((key) => {
      return Object.values(services(key)) as Provider[];
    }),
    ...resolvers.keys().flatMap((key) => {
      return Object.values(resolvers(key)) as Provider[];
    }),
  ],
})
export class OpenApiModule {}
