import { Model, Optional, DataTypes } from 'sequelize';
import { LinkAttributes, LinkCreationAttributes } from '../../entities/links.entity';
import { TableInitFunc } from '../interfaces/table-init-func.interface';
import { TableAssociateFunc } from '../interfaces/table-associate-func.interface';
import { LinkVisible } from '../interfaces/link.interface';

export default class Links extends Model<
  Omit<LinkAttributes, 'updatedAt' | 'createdAt'>,
  Optional<Omit<LinkCreationAttributes, 'id' | 'updatedAt' | 'createdAt'>, 'visible' | 'userId'>
> {
  public id!: number;
  public url!: string;
  public name!: string;
  public image!: string;
  public target!: string;
  public description!: string;
  public visible!: string;
  public userId!: number;
  public rel?: string;
  public rss?: string;
}

export const init: TableInitFunc = function init(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect();
  Links.init(
    {
      id: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        autoIncrement: true,
        primaryKey: true,
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'URL address',
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Name',
      },
      image: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Image',
      },
      target: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: 'Open window method (values:[_blank, _self])',
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Description',
      },
      visible: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: LinkVisible.Yes,
        comment: 'Visible ("yes" or "no", default: "yes")',
      },
      userId: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        allowNull: false,
        defaultValue: 0,
        comment: 'User id',
      },
      rel: {
        type: DataTypes.STRING,
        comment: 'rel',
      },
      rss: {
        type: DataTypes.STRING,
        comment: 'rss',
      },
    },
    {
      sequelize,
      tableName: `${prefix}links`,
      indexes: [
        { name: 'target', fields: ['target'] },
        { name: 'visible', fields: ['visible'] },
        { name: 'user_id', fields: ['user_id'] },
      ],
      comment: 'Links',
    },
  );
};

// 关联
export const associate: TableAssociateFunc = function associate(models) {
  // Links.id <--> TermRelationships.objectId
  models.Links.hasMany(models.TermRelationships, {
    foreignKey: 'objectId',
    sourceKey: 'id',
    as: 'LinkTermRelationships',
    constraints: false,
  });
};
