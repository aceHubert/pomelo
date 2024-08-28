import { Sequelize } from 'sequelize';
import { Injectable, Inject, OnApplicationShutdown } from '@nestjs/common';
import { IdentityDatasourceOptions } from './interfaces/identity-datasource-options.interface';
import { DatabaseManager } from './sequelize';
import { Models } from './sequelize/interfaces/table-associate-func.interface';
import { IDENTITY_OPTIONS } from './constants';

@Injectable()
export class IdentityDatasourceService implements OnApplicationShutdown {
  sequelize: Sequelize;
  models: Models;
  // initDatas: DatabaseManager['initDatas'];

  constructor(@Inject(IDENTITY_OPTIONS) options: IdentityDatasourceOptions) {
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
    // this.initDatas = dbManager.initDatas.bind(dbManager);
  }

  onApplicationShutdown() {
    // close db connection
    this.sequelize && this.sequelize.close();
  }
}
