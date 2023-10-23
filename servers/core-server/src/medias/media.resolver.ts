import * as path from 'path';
import { Inject } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { I18n, I18nContext } from 'nestjs-i18n';
import { FileUpload } from 'graphql-upload/Upload.js';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.js';
import { Authorized } from 'nestjs-authorization';
import { RamAuthorized } from 'nestjs-ram-authorization';
import { ResolveTree } from 'graphql-parse-resolve-info';
import { MediaDataSource } from '@pomelo/datasource';
import { Fields, User, RequestUser } from '@pomelo/shared';
import { createMetaResolver } from '@/common/resolvers/meta.resolver';
import { isAbsoluteUrl } from '@/common/utils/path.util';
import { MediaAction } from '@/common/actions';
import { FixedMediaOptions } from './interfaces/media-options.interface';
import { MediaService } from './media.service';
import { PagedMediaArgs } from './dto/media.args';
import {
  FileUploadOptionsInput,
  ImageCropOptionsInput,
  NewMediaInput,
  MediaMetaDataInput,
} from './dto/new-media.input';
import { NewMediaMetaInput } from './dto/new-media-meta.input';
import { UpdateMediaInput } from './dto/update-media.input';
import { PagedMedia, Media, MediaMeta } from './models/media.model';
import { MEDIA_OPTIONS } from './constants';

@Authorized()
@Resolver(() => Media)
export class MediaResolver extends createMetaResolver(Media, MediaMeta, NewMediaMetaInput, MediaDataSource) {
  constructor(
    protected readonly moduleRef: ModuleRef,
    @Inject(MEDIA_OPTIONS) private readonly fileOptions: FixedMediaOptions,
    private readonly fileService: MediaService,
    private readonly mediaDataSource: MediaDataSource,
  ) {
    super(moduleRef);
  }

  @Mutation(() => Media)
  @RamAuthorized(MediaAction.Upload)
  async uploadFile(
    @Args('file', { type: () => GraphQLUpload }) file: FileUpload,
    @Args('options', { type: () => FileUploadOptionsInput, nullable: true })
    options: FileUploadOptionsInput | undefined,
    @User() requestUser: RequestUser,
  ): Promise<Media> {
    const { createReadStream, filename, mimetype } = await file;

    const stream = createReadStream();

    const buffers = [];
    for await (const chunk of stream) {
      buffers.push(chunk);
    }

    // 解决中文乱码问题
    // https://github.com/mscdex/busboy defParamCharset: 'latin1'
    const fileName = Buffer.from(filename, 'latin1').toString('utf8');
    const fileBuffer = Buffer.concat(buffers);

    const md5 = await this.fileService.getFileMd5(fileBuffer);
    let media = await this.mediaDataSource.getByName(md5, [
      'id',
      'fileName',
      'originalFileName',
      'extension',
      'mimeType',
      'path',
      'createdAt',
    ]);

    if (!media || options?.crop) {
      const {
        fileName: md5FileName,
        originalFileName,
        extension,
        path,
        metaData,
      } = await this.fileService.saveFile(fileBuffer, {
        originalName: options?.fileName || fileName,
        mimeType: mimetype,
        crop: options?.crop,
      });
      media = await this.mediaDataSource.create(
        {
          fileName: md5FileName,
          originalFileName,
          extension,
          mimeType: mimetype,
          path,
        },
        metaData,
        requestUser,
      );
    }

    const { original, ...rest } = await this.fileService.toFileModel(media, media.metaData);
    return {
      ...original,
      ...rest,
      id: media.id,
      originalFileName: media.originalFileName,
      extension: media.extension,
      mimeType: media.mimeType,
      createdAt: media.createdAt,
    };
  }

  @Mutation(() => [Media])
  @RamAuthorized(MediaAction.Upload)
  async uploadFiles(
    @Args('files', { type: () => [GraphQLUpload] }) files: FileUpload[],
    @User() requestUser: RequestUser,
  ): Promise<Media[]> {
    return Promise.all(
      files.map(async (file) => {
        const { createReadStream, filename, mimetype } = await file;

        const stream = createReadStream();

        const buffers = [];
        for await (const chunk of stream) {
          buffers.push(chunk);
        }

        // 解决中文乱码问题
        // https://github.com/mscdex/busboy defParamCharset: 'latin1'
        const fileName = Buffer.from(filename, 'latin1').toString('utf8');
        const fileBuffer = Buffer.concat(buffers);
        const md5 = await this.fileService.getFileMd5(fileBuffer);
        let media = await this.mediaDataSource.getByName(md5, [
          'id',
          'fileName',
          'originalFileName',
          'extension',
          'mimeType',
          'path',
          'createdAt',
        ]);

        if (!media) {
          const { originalFileName, extension, path, metaData } = await this.fileService.saveFile(fileBuffer, {
            originalName: fileName,
            mimeType: mimetype,
          });
          media = await this.mediaDataSource.create(
            {
              fileName: md5,
              originalFileName: originalFileName,
              extension,
              mimeType: mimetype,
              path,
            },
            metaData,
            requestUser,
          );
        }

        const { original, ...rest } = await this.fileService.toFileModel(media, media.metaData);
        return {
          ...original,
          ...rest,
          id: media.id,
          originalFileName: media.originalFileName,
          extension: media.extension,
          mimeType: media.mimeType,
          createdAt: media.createdAt,
        };
      }),
    );
  }

  @Mutation(() => Media)
  async cropImage(
    @Args('id', { type: () => ID, description: 'Media id' }) id: number,
    @Args('options', { type: () => ImageCropOptionsInput }) options: ImageCropOptionsInput,
    @I18n() i18n: I18nContext,
    @User() requestUser: RequestUser,
  ): Promise<Media | undefined> {
    const media = await this.mediaDataSource.get(id, [
      'fileName',
      'originalFileName',
      'extension',
      'mimeType',
      'path',
      'createdAt',
    ]);
    if (media) {
      if (isAbsoluteUrl(media.path))
        throw new Error(i18n.tv('medias.crop_absolute_image_forbidden', 'Cannot crop absolute url image'));

      const {
        fileName,
        originalFileName,
        extension,
        path: filePath,
        metaData,
      } = await this.fileService.saveFile(path.join(this.fileOptions.dest, media.path), {
        originalName: `${media.originalFileName}${media.extension}`,
        mimeType: media.mimeType,
        crop: {
          left: options.left,
          top: options.top,
          width: options.width,
          height: options.height,
        },
      });
      if (options.replace) {
        await this.mediaDataSource.update(
          id,
          {
            fileName,
            path: filePath,
          },
          metaData,
          requestUser,
        );
        const { original, ...rest } = await this.fileService.toFileModel(
          {
            ...media,
            fileName,
            path: filePath,
          },
          metaData,
        );
        return {
          ...original,
          ...rest,
          id: media.id,
          originalFileName: media.originalFileName,
          extension: media.extension,
          mimeType: media.mimeType,
          createdAt: media.createdAt,
        };
      } else {
        const newMedia = await this.mediaDataSource.create(
          {
            fileName,
            originalFileName,
            extension,
            mimeType: media.mimeType,
            path: filePath,
          },
          metaData,
          requestUser,
        );
        const { original, ...rest } = await this.fileService.toFileModel(newMedia, newMedia.metaData);
        return {
          ...original,
          ...rest,
          id: newMedia.id,
          originalFileName: newMedia.originalFileName,
          extension: newMedia.extension,
          mimeType: newMedia.mimeType,
          createdAt: newMedia.createdAt,
        };
      }
    }
    return;
  }

  @Query(() => Media)
  @RamAuthorized(MediaAction.Detail)
  async media(
    @Args('id', { type: () => ID, description: 'Media id' }) id: number,
    @Fields() fields: ResolveTree,
  ): Promise<Media | undefined> {
    const media = await this.mediaDataSource.get(id, [
      // toFileModel requires these fields
      ...new Set(this.getFieldNames(fields.fieldsByTypeName.Media).concat(['fileName', 'path', 'extension'])),
    ]);
    if (media) {
      const { original, ...rest } = await this.fileService.toFileModel(media, media.metaData);
      return {
        ...original,
        ...rest,
        id: media.id,
        originalFileName: media.originalFileName,
        extension: media.extension,
        mimeType: media.mimeType,
        createdAt: media.createdAt,
      };
    }
    return;
  }

  @Query(() => PagedMedia)
  @RamAuthorized(MediaAction.PagedList)
  async medias(@Args() args: PagedMediaArgs, @Fields() fields: ResolveTree): Promise<PagedMedia> {
    const { rows, ...rest } = await this.mediaDataSource.getPaged(args, [
      // toFileModel requires these fields
      ...new Set(
        this.getFieldNames(fields.fieldsByTypeName.PagedMedia.rows.fieldsByTypeName.Media).concat([
          'fileName',
          'path',
          'extension',
        ]),
      ),
    ]);

    const formattedRows = await Promise.all(
      rows.map(async (media) => {
        const { original, ...rest } = await this.fileService.toFileModel(media, media.metaData);
        return {
          ...original,
          ...rest,
          id: media.id,
          originalFileName: media.originalFileName,
          extension: media.extension,
          mimeType: media.mimeType,
          createdAt: media.createdAt,
        };
      }),
    );

    return {
      rows: formattedRows,
      ...rest,
    };
  }

  @Mutation(() => Media)
  @RamAuthorized(MediaAction.Create)
  async createMedia(
    @Args('model', { type: () => NewMediaInput }) model: NewMediaInput,
    @Args('metaData', { type: () => MediaMetaDataInput }) metaData: MediaMetaDataInput,
    @User()
    requestUser: RequestUser,
  ): Promise<Media> {
    const media = await this.mediaDataSource.create(model, metaData, requestUser);
    const { original, ...rest } = await this.fileService.toFileModel(media, media.metaData);
    return {
      ...original,
      ...rest,
      id: media.id,
      originalFileName: media.originalFileName,
      extension: media.extension,
      mimeType: media.mimeType,
      createdAt: media.createdAt,
    };
  }

  @Mutation(() => Boolean)
  updateMedia(
    @Args('id', { type: () => ID, description: 'Media id' }) id: number,
    @Args('model', { type: () => UpdateMediaInput }) model: UpdateMediaInput,
    @Args('metaData', { type: () => MediaMetaDataInput, nullable: true }) metaData: MediaMetaDataInput | undefined,
    @User()
    requestUser: RequestUser,
  ): Promise<boolean> {
    return this.mediaDataSource.update(id, model, metaData, requestUser);
  }
}
