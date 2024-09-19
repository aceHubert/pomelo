import { Sequelize } from 'sequelize';
import { Injectable, Inject, OnApplicationShutdown } from '@nestjs/common';
import { InfrastructureDatasourceOptions } from './interfaces/infrastructure-datasource-options.interface';
import { Models } from './sequelize/interfaces/table-associate-func.interface';
import { DatabaseManager } from './sequelize/index';
import { INFRASTRUCTURE_OPTIONS } from './constants';

@Injectable()
export class InfrastructureDatasourceService implements OnApplicationShutdown {
  sequelize: Sequelize;
  models: Models;
  initDatas: DatabaseManager['initDatas'];

  constructor(@Inject(INFRASTRUCTURE_OPTIONS) options: InfrastructureDatasourceOptions) {
    const dbManager =
      typeof options.connection === 'string'
        ? new DatabaseManager(options.connection, {
            tablePrefix: options.tablePrefix,
          })
        : new DatabaseManager({
            ...options.connection,
            tablePrefix: options.tablePrefix,
          });

    this.sequelize = dbManager.sequelize;
    this.models = dbManager.associate();
    this.initDatas = dbManager.initDatas.bind(dbManager);
  }

  onApplicationShutdown() {
    // close db connection
    this.sequelize?.close();
  }
}
