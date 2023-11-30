import { Sequelize } from 'sequelize';
import { Injectable, Inject, OnApplicationShutdown } from '@nestjs/common';
import { InfrastructureOptions } from './interfaces/infrastructure-options.interface';
import { Models } from './sequelize/interfaces/models.interface';
import { TableInitFunc } from './sequelize/interfaces/table-init-func.interface';
import { TableAssociateFunc } from './sequelize/interfaces/table-associate-func.interface';
import * as Entities from './sequelize/entities';
import { INFRASTRUCTURE_OPTIONS } from './constants';

@Injectable()
export class InfrastructureService implements OnApplicationShutdown {
  sequelize: Sequelize;
  models: Models;

  constructor(@Inject(INFRASTRUCTURE_OPTIONS) options: InfrastructureOptions) {
    let sequelize: Sequelize;
    if (typeof options.connection === 'string') {
      sequelize = new Sequelize(options.connection, {
        define: {
          freezeTableName: true,
          underscored: true,
          timestamps: true,
          createdAt: true,
          updatedAt: true,
          charset: 'utf8',
          collate: '',
        },
      });
    } else {
      const { host, port, dialect, charset, collate, database, username, password } = options.connection;
      sequelize = new Sequelize(database!, username!, password, {
        host,
        port,
        dialect,
        define: {
          freezeTableName: true,
          underscored: true,
          timestamps: true,
          createdAt: true,
          updatedAt: true,
          charset,
          collate,
        },
      });
    }

    this.sequelize = sequelize;
    this.models = (function initializer() {
      const models: Partial<Models> = {};
      const associateFuncs: TableAssociateFunc[] = [];

      for (const key in Entities) {
        const { init, associate, default: model } = (Entities as any)[key];
        init &&
          (init as TableInitFunc)(sequelize, {
            prefix: options.tablePrefix || '',
          });
        associate && associateFuncs.push(associate);
        model && (models[model.name as keyof Models] = model);
      }

      associateFuncs.forEach((associate) => {
        associate(models as Models);
      });
      return models as Models;
    })();
  }

  onApplicationShutdown() {
    // close db connection
    this.sequelize && this.sequelize.close();
  }
}
