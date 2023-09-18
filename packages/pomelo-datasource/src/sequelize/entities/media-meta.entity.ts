import { Model, DataTypes } from 'sequelize';
import { MediaMetaAttributes, MediaMetaCreationAttributes } from '../../entities/media-meta.entity';
import { TableInitFunc } from '../interfaces/table-init-func.interface';
import { MediaMetaPresetKeys } from '../utils/preset-keys.util';

export default class MediaMeta extends Model<MediaMetaAttributes, MediaMetaCreationAttributes> {
  public id!: number;
  public mediaId!: number;
  public metaKey!: string;
  public metaValue?: string;
}

export const init: TableInitFunc = function init(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect();
  MediaMeta.init(
    {
      id: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        autoIncrement: true,
        primaryKey: true,
      },
      mediaId: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        allowNull: false,
        defaultValue: 0,
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
      indexes: [
        { name: 'media_id', fields: ['media_id'] },
        { name: 'meta_key', fields: ['meta_key'] },
      ],
      createdAt: false,
      updatedAt: false,
      comment: 'Media metas',
    },
  );

  MediaMeta.addScope(MediaMetaPresetKeys.Matedata, {
    where: {
      metaKey: MediaMetaPresetKeys.Matedata,
    },
  });
};
