import { Module, DynamicModule } from '@nestjs/common';
import { SequelizeDataSourceOptions } from './interfaces/sequelize-datasource-options.interface';
import * as DataSources from './datasources';

const dataSourceProviders = Object.values(DataSources);

@Module({
  providers: dataSourceProviders,
  exports: dataSourceProviders,
})
export class DataSourceModule {
  static forFeature(options: SequelizeDataSourceOptions): DynamicModule {
    return {
      module: DataSourceModule,
      global: options.isGlobal,
    };
  }
}
