import * as path from 'path';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { I18n, I18nContext } from 'nestjs-i18n';
import { VoidResolver } from 'graphql-scalars';
import { FileUpload } from 'graphql-upload/Upload.js';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.js';
import { Authorized, Anonymous } from '@ace-pomelo/authorization';
import { RamAuthorized } from '@ace-pomelo/ram-authorization';
import { ResolveTree } from 'graphql-parse-resolve-info';
import {
  isAbsoluteUrl,
  Fields,
  User,
  RequestUser,
  UserCapability,
  ForbiddenError,
  INFRASTRUCTURE_SERVICE,
  UserPattern,
  MediaPattern,
} from '@ace-pomelo/shared/server';
import { MediaAction } from '@/common/actions';
import { createMetaResolver } from '@/common/resolvers/meta.resolver';
import { MediaOptions } from './interfaces/media-options.interface';
import { MediaModel, PagedMediaModel } from './interfaces/media.interface';
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
export class MediaResolver extends createMetaResolver(Media, MediaMeta, NewMediaMetaInput, {
  authDecorator: (method) => {
    const ramAction =
      method === 'getMeta'
        ? MediaAction.MetaDetail
        : method === 'getMetas' || method === 'fieldMetas'
        ? MediaAction.MetaList
        : method === 'createMeta' || method === 'createMetas'
        ? MediaAction.MetaCreate
        : method === 'updateMeta' || method === 'updateMetaByKey'
        ? MediaAction.MetaUpdate
        : MediaAction.MetaDelete;

    return method === 'getMeta' || method === 'getMetas'
      ? [RamAuthorized(ramAction), Anonymous()]
      : [RamAuthorized(ramAction)];
  },
}) {
  constructor(
    @Inject(MEDIA_OPTIONS) private readonly mediaOptions: Required<MediaOptions>,
    @Inject(INFRASTRUCTURE_SERVICE) protected readonly basicService: ClientProxy,
    private readonly mediaService: MediaService,
  ) {
    super(basicService);
  }

  @Mutation(() => Media)
  @RamAuthorized(MediaAction.Upload)
  async uploadFile(
    @Args('file', { type: () => GraphQLUpload }) file: FileUpload,
    @Args('options', { type: () => FileUploadOptionsInput, nullable: true })
    options: FileUploadOptionsInput | undefined,
    @I18n() i18n: I18nContext,
    @User() requestUser: RequestUser,
  ): Promise<Media> {
    // 检测是否有上传文件的权限，没有则抛出异常不处理文件流
    const hasCapability = await this.basicService
      .send<boolean>(UserPattern.HasCapability, {
        id: Number(requestUser.sub),
        capability: UserCapability.UploadFiles,
      })
      .lastValue();

    if (!hasCapability) {
      throw new ForbiddenError(
        i18n.tv('infrastructure-bff.media_resolver.upload_files_forbidden', 'No permission to upload files'),
      );
    }

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

    const md5 = await this.mediaService.getFileMd5(fileBuffer);
    let media = await this.basicService
      .send<MediaModel | undefined>(MediaPattern.GetByName, {
        fileName: md5,
        fields: ['id', 'fileName', 'originalFileName', 'extension', 'mimeType', 'path', 'createdAt'],
      })
      .lastValue();

    if (!media || options?.crop) {
      const {
        md5: md5FileName,
        originalFileName,
        extension,
        path,
        metaData,
      } = await this.mediaService.saveFile(fileBuffer, {
        originalName: options?.fileName || fileName,
        mimeType: mimetype,
        md5,
        crop: options?.crop,
      });
      media = await this.basicService
        .send<MediaModel>(MediaPattern.Create, {
          fileName: md5FileName,
          originalFileName,
          extension,
          mimeType: mimetype,
          path,
          metaData,
          requestUserId: Number(requestUser.sub),
        })
        .lastValue();
    }

    const { original, ...rest } = await this.mediaService.toFileModel(media, media.metaData);
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

  @Mutation(() => [Media], { description: 'Upload files.' })
  @RamAuthorized(MediaAction.Upload)
  async uploadFiles(
    @Args('files', { type: () => [GraphQLUpload] }) files: FileUpload[],
    @I18n() i18n: I18nContext,
    @User() requestUser: RequestUser,
  ): Promise<Media[]> {
    // 检测是否有上传文件的权限，没有则抛出异常不处理文件流
    const hasCapability = await this.basicService
      .send<boolean>(UserPattern.HasCapability, {
        id: Number(requestUser.sub),
        capability: UserCapability.UploadFiles,
      })
      .lastValue();

    if (!hasCapability) {
      throw new ForbiddenError(
        i18n.tv('infrastructure-bff.media_resolver.upload_files_forbidden', 'No permission to upload files'),
      );
    }

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
        const md5 = await this.mediaService.getFileMd5(fileBuffer);
        let media = await this.basicService
          .send<MediaModel | undefined>(MediaPattern.GetByName, {
            fileName: md5,
            fields: ['id', 'fileName', 'originalFileName', 'extension', 'mimeType', 'path', 'createdAt'],
          })
          .lastValue();

        if (!media) {
          const {
            md5: md5FileName,
            originalFileName,
            extension,
            path,
            metaData,
          } = await this.mediaService.saveFile(fileBuffer, {
            originalName: fileName,
            mimeType: mimetype,
            md5,
          });
          media = await this.basicService
            .send<MediaModel>(MediaPattern.Create, {
              fileName: md5FileName,
              originalFileName,
              extension,
              mimeType: mimetype,
              path,
              metaData,
              requestUserId: Number(requestUser.sub),
            })
            .lastValue();
        }

        const { original, ...rest } = await this.mediaService.toFileModel(media, media.metaData);
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

  @Mutation(() => Media, { nullable: true, description: 'Crop image.' })
  async cropImage(
    @Args('id', { type: () => ID, description: 'Media id' }) id: number,
    @Args('options', { type: () => ImageCropOptionsInput }) options: ImageCropOptionsInput,
    @I18n() i18n: I18nContext,
    @User() requestUser: RequestUser,
  ): Promise<Media | undefined> {
    // 检测是否有编辑文件的权限，没有则抛出异常不处理文件流
    const hasCapability = await this.basicService
      .send<boolean>(UserPattern.HasCapability, {
        id: Number(requestUser.sub),
        capability: UserCapability.EditFiles,
      })
      .lastValue();

    if (!hasCapability) {
      throw new ForbiddenError(
        i18n.tv('infrastructure-bff.media_resolver.edit_files_forbidden', 'No permission to edit files'),
      );
    }

    const media = await this.basicService
      .send<MediaModel | undefined>(MediaPattern.Get, {
        id,
        fields: ['fileName', 'originalFileName', 'extension', 'mimeType', 'path', 'createdAt'],
      })
      .lastValue();

    if (media) {
      if (isAbsoluteUrl(media.path))
        throw new Error(
          i18n.tv('infrastructure-bff.media_resolver.crop_absolute_image_forbidden', 'Cannot crop absolute url image'),
        );

      const {
        md5: md5FileName,
        originalFileName,
        extension,
        path: filePath,
        metaData,
      } = await this.mediaService.saveFile(path.join(this.mediaOptions.dest, media.path), {
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
        await this.basicService
          .send<void>(MediaPattern.Update, {
            id,
            fileName: md5FileName,
            path: filePath,
            metaData,
            requestUserId: Number(requestUser.sub),
          })
          .lastValue();
        const { original, ...rest } = await this.mediaService.toFileModel(
          {
            ...media,
            fileName: md5FileName,
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
        const newMedia = await this.basicService
          .send<MediaModel>(MediaPattern.Create, {
            fileName: md5FileName,
            originalFileName,
            extension,
            mimeType: media.mimeType,
            path: filePath,
            metaData,
            requestUserId: Number(requestUser.sub),
          })
          .lastValue();
        const { original, ...rest } = await this.mediaService.toFileModel(newMedia, newMedia.metaData);
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

  @Query(() => Media, { nullable: true, description: 'Get media by id.' })
  @RamAuthorized(MediaAction.Detail)
  async media(
    @Args('id', { type: () => ID, description: 'Media id' }) id: number,
    @Fields() fields: ResolveTree,
  ): Promise<Media | undefined> {
    const media = await this.basicService
      .send<MediaModel | undefined>(MediaPattern.Get, {
        id,
        fields: [
          ...new Set(this.getFieldNames(fields.fieldsByTypeName.Media).concat(['fileName', 'path', 'extension'])),
        ],
      })
      .lastValue();

    if (media) {
      const { original, ...rest } = await this.mediaService.toFileModel(media, media.metaData);
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

  @Query(() => PagedMedia, { description: 'Get paged medias.' })
  @RamAuthorized(MediaAction.PagedList)
  async medias(@Args() args: PagedMediaArgs, @Fields() fields: ResolveTree): Promise<PagedMedia> {
    const { rows, ...rest } = await this.basicService
      .send<PagedMediaModel>(MediaPattern.GetPaged, {
        query: args,
        fields: [
          ...new Set(
            this.getFieldNames(fields.fieldsByTypeName.PagedMedia.rows.fieldsByTypeName.Media).concat([
              'fileName',
              'path',
              'extension',
            ]),
          ),
        ],
      })
      .lastValue();

    const formattedRows = await Promise.all(
      rows.map(async (media) => {
        const { original, ...rest } = await this.mediaService.toFileModel(media, media.metaData);
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

  @Mutation(() => Media, { description: 'Create a new media.' })
  @RamAuthorized(MediaAction.Create)
  async createMedia(
    @Args('model', { type: () => NewMediaInput }) model: NewMediaInput,
    @Args('metaData', { type: () => MediaMetaDataInput }) metaData: MediaMetaDataInput,
    @User()
    requestUser: RequestUser,
  ): Promise<Media> {
    const media = await this.basicService
      .send<MediaModel>(MediaPattern.Create, {
        ...model,
        metaData,
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();
    const { original, ...rest } = await this.mediaService.toFileModel(media, media.metaData);
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

  @Mutation(() => VoidResolver, { nullable: true, description: 'Delete media.' })
  async updateMedia(
    @Args('id', { type: () => ID, description: 'Media id' }) id: number,
    @Args('model', { type: () => UpdateMediaInput }) model: UpdateMediaInput,
    @Args('metaData', { type: () => MediaMetaDataInput, nullable: true }) metaData: MediaMetaDataInput | undefined,
    @User()
    requestUser: RequestUser,
  ): Promise<void> {
    await this.basicService
      .send<void>(MediaPattern.Update, {
        ...model,
        id,
        metaData,
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();
  }
}
