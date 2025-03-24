import { Controller } from '@nestjs/common';
import { BoolValue } from '@ace-pomelo/shared/server/proto-ts/google/protobuf/wrappers';
import { Empty } from '@ace-pomelo/shared/server/proto-ts/google/protobuf/empty';
import {
  MEDIA_SERVICE_NAME,
  MediaServiceControllerMethods,
  MediaServiceController,
  MediaMetaDataModel as GRPCMediaMetaDataModel,
  GetMediaRequest,
  GetMediaResponse,
  GetMediaByNameRequest,
  GetPagedMediaRequest,
  GetPagedMediaResponse,
  IsMediaExistRequest,
  CreateMediaRequest,
  CreateMediaResponse,
  UpdateMediaRequest,
  UpdateMediaMetaDataRequest,
} from '@ace-pomelo/shared/server/proto-ts/media';
import { MediaDataSource, MediaMetaDataModel } from '../datasource';
import { createMetaController } from './meta.controller';

@Controller()
@MediaServiceControllerMethods()
export class MediaController
  extends createMetaController('media', MEDIA_SERVICE_NAME)
  implements MediaServiceController
{
  constructor(private readonly mediaDatasource: MediaDataSource) {
    super(mediaDatasource);
  }

  private toGRPCMetaData(metaData: MediaMetaDataModel): GRPCMediaMetaDataModel {
    const { fileSize, width, height, imageScales = [], ...otherMetas } = metaData;
    return {
      fileSize,
      width,
      height,
      imageScales,
      otherMetas,
    };
  }

  get({ fields, id }: GetMediaRequest): Promise<GetMediaResponse> {
    return this.mediaDatasource.get(id, fields).then((result) => {
      if (!result) return { media: void 0 };

      const { metaData, ...rest } = result;
      return {
        media: {
          ...rest,
          metaData: metaData && this.toGRPCMetaData(metaData),
        },
      };
    });
  }

  getByName({ fields, fileName }: GetMediaByNameRequest): Promise<GetMediaResponse> {
    if (!fileName) return Promise.resolve({ media: void 0 });

    return this.mediaDatasource.getByName(fileName, fields).then((result) => {
      if (!result) return { media: void 0 };

      const { metaData, ...rest } = result;
      return {
        media: {
          ...rest,
          metaData: metaData && this.toGRPCMetaData(metaData),
        },
      };
    });
  }

  getPaged({ fields, ...query }: GetPagedMediaRequest): Promise<GetPagedMediaResponse> {
    return this.mediaDatasource.getPaged(query, fields).then(({ rows, ...rest }) => {
      return {
        ...rest,
        rows: rows.map(({ metaData, ...rest }) => ({
          ...rest,
          metaData: metaData && this.toGRPCMetaData(metaData),
        })),
      };
    });
  }

  isExists({ fileName }: IsMediaExistRequest): Promise<BoolValue> {
    if (!fileName) return Promise.resolve({ value: true });

    return this.mediaDatasource.isExists(fileName).then((result) => {
      return { value: result };
    });
  }

  create({ requestUserId, metaData, ...model }: CreateMediaRequest): Promise<CreateMediaResponse> {
    return this.mediaDatasource.create(model, metaData, requestUserId).then(({ metaData, metas, ...media }) => ({
      media,
      metaData: this.toGRPCMetaData(metaData),
      metas,
    }));
  }

  update({ id, requestUserId, metaData, ...model }: UpdateMediaRequest): Promise<Empty> {
    return this.mediaDatasource.update(id, model, metaData, requestUserId).then(() => {
      return {};
    });
  }

  updateMetaData({ id, metaData, requestUserId }: UpdateMediaMetaDataRequest): Promise<Empty> {
    return this.mediaDatasource.updateMetaData(id, metaData, requestUserId).then(() => {
      return {};
    });
  }
}
