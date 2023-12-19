import { Sequelize } from 'sequelize';
import { Injectable, Inject, OnApplicationShutdown } from '@nestjs/common';
import { InfrastructureOptions } from './interfaces/infrastructure-options.interface';
import { Models } from './sequelize/interfaces/table-associate-func.interface';
import { DatabaseManager } from './sequelize';
import { INFRASTRUCTURE_OPTIONS } from './constants';

@Injectable()
export class InfrastructureService implements OnApplicationShutdown {
  sequelize: Sequelize;
  models: Models;
  initDatas: DatabaseManager['initDatas'];

  constructor(@Inject(INFRASTRUCTURE_OPTIONS) options: InfrastructureOptions) {
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
