import { Controller, ParseIntPipe, ParseArrayPipe, DefaultValuePipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MediaPattern } from '@ace-pomelo/shared/server';
import {
  MediaDataSource,
  MediaModel,
  PagedMediaModel,
  MediaMetaDataModel,
  MediaMetaModel,
  NewMediaMetaInput,
} from '../datasource';
import { createMetaController } from './meta.controller';
import { PagedMediaQueryPayload, NewMediaPayload, UpdateMediaPayload } from './payload/media.payload';

@Controller()
export class MediaController extends createMetaController<MediaMetaModel, NewMediaMetaInput>('media') {
  constructor(private readonly mediaDatasource: MediaDataSource) {
    super(mediaDatasource);
  }

  @MessagePattern(MediaPattern.Get)
  get(
    @Payload('id', ParseIntPipe) id: number,
    @Payload('fields', new ParseArrayPipe({ items: String })) fields: string[],
  ): Promise<MediaModel | undefined> {
    return this.mediaDatasource.get(id, fields);
  }

  @MessagePattern(MediaPattern.GetByName)
  getByName(
    @Payload('fileName', new DefaultValuePipe('')) fileName: string,
    @Payload('fields', new ParseArrayPipe({ items: String })) fields: string[],
  ): Promise<MediaModel | undefined> {
    return this.mediaDatasource.getByName(fileName, fields);
  }

  @MessagePattern(MediaPattern.GetPaged)
  getPaged(
    @Payload('query') query: PagedMediaQueryPayload,
    @Payload('fields', new ParseArrayPipe({ items: String })) fields: string[],
  ): Promise<PagedMediaModel> {
    return this.mediaDatasource.getPaged(query, fields);
  }

  @MessagePattern(MediaPattern.FilenameExists)
  async isExists(@Payload('fileName') fileName: string): Promise<boolean> {
    if (!fileName) return true;

    return this.mediaDatasource.isExists(fileName);
  }

  @MessagePattern(MediaPattern.Create)
  create(@Payload() payload: NewMediaPayload): Promise<
    MediaModel & {
      metaData: MediaMetaDataModel;
      metas: MediaMetaModel[];
    }
  > {
    const { requestUserId, metaData, ...model } = payload;
    return this.mediaDatasource.create(model, metaData, requestUserId);
  }

  @MessagePattern(MediaPattern.Update)
  update(@Payload() payload: UpdateMediaPayload): Promise<void> {
    const { id, requestUserId, metaData, ...model } = payload;
    return this.mediaDatasource.update(id, model, metaData, requestUserId);
  }

  @MessagePattern(MediaPattern.UpdateMetaData)
  updateMetaData(
    @Payload('mediaId', ParseIntPipe) mediaId: number,
    @Payload('metaData') metaData: MediaMetaDataModel,
    @Payload('requestUserId', ParseIntPipe) requestUserId: number,
  ): Promise<void> {
    return this.mediaDatasource.updateMetaData(mediaId, metaData, requestUserId);
  }
}
