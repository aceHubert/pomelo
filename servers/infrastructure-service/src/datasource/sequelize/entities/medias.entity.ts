import { Optional, DataTypes } from 'sequelize';
import { MediaAttributes, MediaCreationAttributes } from '../../entities/medias.entity';
import { MediaMetaPresetKeys } from '../../entities/media-meta.entity';
import { Model } from '../model/model';
import { MediaMeta } from './media-meta.entity';

export class Medias extends Model<
  Omit<MediaAttributes, 'createdAt'>,
  Optional<Omit<MediaCreationAttributes, 'id' | 'createdAt'>, 'userId'>
> {
  public id!: number;
  public fileName!: string;
  public originalFileName!: string;
  public extension!: string;
  public mimeType!: string;
  public path!: string;
  public userId?: number;

  // timestamps!
  public readonly createdAt!: Date;
}

Medias.initialize = function initialize(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect() === 'mysql';
  Medias.init(
    {
      id: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        autoIncrement: true,
        primaryKey: true,
      },
      fileName: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'File name',
      },
      originalFileName: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Original file name',
      },
      extension: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: 'File extension',
      },
      mimeType: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'File mime type',
      },
      path: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'File relative path',
      },
      userId: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        allowNull: false,
        defaultValue: 0,
        comment: 'User id',
      },
    },
    {
      sequelize,
      tableName: `${prefix}medias`,
      indexes: [
        { name: 'extension', fields: ['extension'] },
        { name: 'mime_type', fields: ['mime_type'] },
        { name: 'user_id', fields: ['user_id'] },
      ],
      updatedAt: false,
      comment: 'Medias',
    },
  );
};

// 关联
Medias.associate = function associate() {
  // Medias.id <--> MediaMeta.mediaId
  Medias.hasMany(MediaMeta, {
    foreignKey: 'mediaId',
    sourceKey: 'id',
    as: 'MediaMetas',
    constraints: false,
  });
  MediaMeta.belongsTo(Medias, { foreignKey: 'mediaId', targetKey: 'id', constraints: false });

  Medias.hasOne(MediaMeta.scope(MediaMetaPresetKeys.Matedata), {
    foreignKey: 'mediaId',
    sourceKey: 'id',
    as: 'MediaMetadata',
    constraints: false,
  });
};
