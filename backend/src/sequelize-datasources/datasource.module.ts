import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityModule } from '@/sequelize-entities/entity.module';
import * as DataSources from './datasources';

const providers = Object.values(DataSources);

@Global()
@Module({
  imports: [
    EntityModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        connection: config.getOrThrow('database.connection'),
        tablePrefix: config.get('database.tablePrefix', ''),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: providers,
  exports: providers,
})
export class DataSourceModule {}
