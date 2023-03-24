import { Sequelize } from 'sequelize';

export type TableInitOptions = {
  prefix: string;
};

export interface TableInitFunc {
  (sequelize: Sequelize, options: TableInitOptions): void;
}
