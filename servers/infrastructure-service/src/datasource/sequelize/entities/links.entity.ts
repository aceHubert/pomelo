import { Optional, DataTypes } from 'sequelize';
import { LinkVisible, LinkTarget } from '@ace-pomelo/shared/server';
import { LinkAttributes, LinkCreationAttributes } from '../../entities/links.entity';
import { Model } from '../model/model';
import { TermRelationships } from './term-relationships.entity';

export class Links extends Model<
  Omit<LinkAttributes, 'updatedAt' | 'createdAt'>,
  Optional<Omit<LinkCreationAttributes, 'id' | 'updatedAt' | 'createdAt'>, 'visible' | 'userId'>
> {
  public id!: number;
  public url!: string;
  public name!: string;
  public image!: string;
  public target!: LinkTarget;
  public description!: string;
  public visible!: LinkVisible;
  public userId!: number;
  public rel?: string;
  public rss?: string;
}

Links.initialize = function init(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect() === 'mysql';
  this.init(
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
Links.associate = function associate() {
  // Links.id <--> TermRelationships.objectId
  Links.hasMany(TermRelationships, {
    foreignKey: 'objectId',
    sourceKey: 'id',
    as: 'LinkTermRelationships',
    constraints: false,
  });
};
