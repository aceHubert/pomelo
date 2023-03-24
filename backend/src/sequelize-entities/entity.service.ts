import { Injectable, Inject } from '@nestjs/common';
import { Sequelize } from 'sequelize';
import * as Entities from './entities';
import { SEQUELIZE_ENTITY_OPTIONS } from './constants';

// Types
import { Models } from './interfaces/models.interface';
import { TableInitFunc } from './interfaces/table-init-func.interface';
import { TableAssociateFunc } from './interfaces/table-associate-func.interface';
import { EntityModuleOptions } from './interfaces/entity-module-options.interface';

@Injectable()
export class EntityService {
  sequelize: Sequelize;
  models: Models;

  constructor(@Inject(SEQUELIZE_ENTITY_OPTIONS) config: EntityModuleOptions) {
    let sequelize: Sequelize;
    if (typeof config.connection === 'string') {
      sequelize = new Sequelize(config.connection, {
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
      const { host, port, dialect, charset, collate, database, username, password } = config.connection;
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
            prefix: config.tablePrefix || '',
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
}
