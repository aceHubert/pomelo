import { DataTypes } from 'sequelize';
import { MediaMetaPresetKeys } from '@ace-pomelo/shared/server';
import { MediaMetaAttributes, MediaMetaCreationAttributes } from '../../entities/media-meta.entity';
import { Model } from '../model/model';

export class MediaMeta extends Model<MediaMetaAttributes, Omit<MediaMetaCreationAttributes, 'id'>> {
  public id!: number;
  public mediaId!: number;
  public metaKey!: string;
  public metaValue?: string;
}

MediaMeta.initialize = function initialize(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect() === 'mysql';
  this.init(
    {
      id: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        autoIncrement: true,
        primaryKey: true,
      },
      mediaId: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        allowNull: false,
        comment: 'Media id',
      },
      metaKey: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Meta key',
      },
      metaValue: {
        type: DataTypes.TEXT('long'),
        comment: 'Meta value',
      },
    },
    {
      sequelize,
      tableName: `${prefix}mediameta`,
      indexes: [{ name: 'media_meta_keys', fields: ['media_id', 'meta_key'], unique: true }],
      createdAt: false,
      updatedAt: false,
      comment: 'Media metas',
    },
  );

  this.addScope(MediaMetaPresetKeys.Matedata, {
    where: {
      metaKey: MediaMetaPresetKeys.Matedata,
    },
  });
};
