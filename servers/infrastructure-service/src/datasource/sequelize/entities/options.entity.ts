import { Optional, DataTypes } from 'sequelize';
import { OptionAutoload } from '@ace-pomelo/shared/server';
import { OptionAttributes, OptionCreationAttributes } from '../../entities/options.entity';
import { Model } from '../model/model';

export class Options extends Model<OptionAttributes, Optional<Omit<OptionCreationAttributes, 'id'>, 'autoload'>> {
  public id!: number;
  public optionName!: string;
  public optionValue!: string;
  public autoload!: OptionAutoload;
}

Options.initialize = function initialize(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect() === 'mysql';
  this.init(
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
        comment: 'Opiton name',
      },
      optionValue: {
        type: DataTypes.TEXT('long'),
        allowNull: false,
        comment: 'Option value',
      },
      autoload: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: OptionAutoload.Yes,
        comment: 'Autoload ("yes" or "no", default: "yes")',
      },
    },
    {
      sequelize,
      tableName: `${prefix}options`,
      indexes: [{ name: 'autoload', fields: ['autoload'] }],
      createdAt: false,
      updatedAt: false,
      comment: 'Options',
    },
  );
};
