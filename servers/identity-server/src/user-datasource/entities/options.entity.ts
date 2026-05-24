import { DataTypes, Optional } from 'sequelize';
import { OptionAutoload } from '@ace-pomelo/shared/server';
import { Model } from '../../datasource/sequelize/model/model';

export interface OptionAttributes {
  id: number;
  optionName: string;
  optionValue: string;
  autoload: OptionAutoload;
}

export class Options extends Model<OptionAttributes, Optional<Omit<OptionAttributes, 'id'>, 'autoload'>> {
  public id!: number;
  public optionName!: string;
  public optionValue!: string;
  public autoload!: OptionAutoload;
}

Options.initialize = function initialize(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect() === 'mysql';
  Options.init(
    {
      id: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        autoIncrement: true,
        primaryKey: true,
      },
      optionName: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      optionValue: {
        type: DataTypes.TEXT('long'),
        allowNull: false,
      },
      autoload: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: OptionAutoload.Yes,
      },
    },
    {
      sequelize,
      tableName: `${prefix}options`,
      indexes: [{ name: 'autoload', fields: ['autoload'] }],
      createdAt: false,
      updatedAt: false,
    },
  );
};
