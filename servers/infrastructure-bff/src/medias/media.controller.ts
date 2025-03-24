import * as path from 'path';
import { ApiTags, ApiBody, ApiConsumes, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import {
  Inject,
  Controller,
  Scope,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  HttpStatus,
  ParseIntPipe,
  Param,
  Get,
  Post,
  Patch,
  Query,
  Body,
  OnModuleInit,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { I18n, I18nContext } from 'nestjs-i18n';
import { Authorized, Anonymous } from '@ace-pomelo/nestjs-authorization';
import { RamAuthorized } from '@ace-pomelo/nestjs-ram-authorization';
import {
  isAbsoluteUrl,
  createResponseSuccessType,
  describeType,
  User,
  ApiAuthCreate,
  ParseQueryPipe,
  ValidatePayloadExistsPipe,
  ForbiddenError,
  RequestUser,
  UserCapability,
  POMELO_SERVICE_PACKAGE_NAME,
} from '@ace-pomelo/shared/server';
import { MediaServiceClient, MEDIA_SERVICE_NAME } from '@ace-pomelo/shared/server/proto-ts/media';
import { UserServiceClient, USER_SERVICE_NAME } from '@ace-pomelo/shared/server/proto-ts/user';
import { MediaAction } from '@/common/actions';
import { createMetaController } from '@/common/controllers/meta.controller';
import { MediaOptions } from './interfaces/media-options.interface';
import { MediaService } from './media.service';
import { PagedMediaQueryDto } from './dto/media-query.dto';
import { FileUploadDto, FilesUploadDto, ImageCropDto, NewMediaDto } from './dto/new-media.dto';
import { NewMediaMetaDto } from './dto/new-media-meta.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { PagedMediaResp, MediaModelResp, MediaMetaModelResp } from './resp/media-model.resp';
import { MEDIA_OPTIONS } from './constants';

@ApiTags('resources')
@Authorized()
@Controller({ path: 'api/medias', scope: Scope.REQUEST })
export class MediaController
  extends createMetaController('media', MediaMetaModelResp, NewMediaMetaDto, {
    authDecorator: (method) => {
      const ramAction =
        method === 'getMeta'
          ? MediaAction.MetaDetail
          : method === 'getMetas'
          ? MediaAction.MetaList
          : method === 'createMeta' || method === 'createMetas'
          ? MediaAction.MetaCreate
          : method === 'updateMeta' || method === 'updateMetaByKey'
          ? MediaAction.MetaUpdate
          : MediaAction.MetaDelete;

      return method === 'getMeta' || method === 'getMetas'
        ? [RamAuthorized(ramAction), Anonymous()]
        : [RamAuthorized(ramAction), ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])];
    },
  })
  implements OnModuleInit
{
  private mediaServiceClient!: MediaServiceClient;
  private userServiceClient!: UserServiceClient;

  constructor(
    @Inject(MEDIA_OPTIONS) private readonly mediaOptions: Required<MediaOptions>,
    @Inject(POMELO_SERVICE_PACKAGE_NAME) private readonly client: ClientGrpc,
    private readonly mediaService: MediaService,
  ) {
    super();
  }

  onModuleInit(): void {
    this.mediaServiceClient = this.client.getService<MediaServiceClient>(MEDIA_SERVICE_NAME);
    this.userServiceClient = this.client.getService<UserServiceClient>(USER_SERVICE_NAME);
  }

  get metaServiceClient() {
    return this.mediaServiceClient;
  }

  /**
   * upload single file
   */
  @Post('upload')
  @RamAuthorized(MediaAction.Upload)
  @UseInterceptors(FileInterceptor('file'))
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File upload',
    type: FileUploadDto,
  })
  @ApiCreatedResponse({
    description: 'File model',
    type: () =>
      createResponseSuccessType(
        { data: describeType(() => MediaModelResp, { description: 'File model' }) },
        'FormTemplateOptionModelsSuccessResp',
      ),
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() options: Omit<FileUploadDto, 'file'> | undefined,
    @I18n() i18n: I18nContext,
    @User() requestUser: RequestUser,
  ) {
    // 检测是否有上传文件的权限，没有则抛出异常不处理文件流
    const { value: hasCapability } = await this.userServiceClient
      .hasCapability({
        requestUserId: Number(requestUser.sub),
        capability: UserCapability.UploadFiles,
      })
      .lastValue();

    if (!hasCapability) {
      throw new ForbiddenError(
        i18n.tv('infrastructure-bff.media_resolver.upload_files_forbidden', 'No permission to upload files'),
      );
    }

    const { buffer, originalname, mimetype } = file;

    // 解决中文乱码问题，https://github.com/expressjs/multer/issues/1104
    const fileName = Buffer.from(originalname, 'latin1').toString('utf8');
    const fileBuffer = buffer;
    const md5 = await this.mediaService.getFileMd5(fileBuffer);
    let { media } = await this.mediaServiceClient
      .getByName({
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
      ({ media } = await this.mediaServiceClient
        .create({
          fileName: md5FileName,
          originalFileName,
          extension,
          mimeType: mimetype,
          path,
          metaData,
          metas: [],
          requestUserId: Number(requestUser.sub),
        })
        .lastValue());
    }
    const { original, ...rest } = await this.mediaService.toFileModel(media, media.metaData);

    return this.success({
      data: {
        ...original,
        ...rest,
        id: media.id,
        originalFileName: media.originalFileName,
        extension: media.extension,
        mimeType: media.mimeType,
        createdAt: media.createdAt,
      },
    });
  }

  /**
   * upload multiple files
   */
  @Post('upload-multi')
  @RamAuthorized(MediaAction.Upload)
  @UseInterceptors(FilesInterceptor('files'))
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Multiple files upload',
    type: FilesUploadDto,
  })
  @ApiCreatedResponse({
    description: 'File models',
    type: () =>
      createResponseSuccessType(
        { data: describeType(() => [MediaModelResp], { description: 'File models' }) },
        'FormTemplateOptionModelsSuccessResp',
      ),
  })
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @I18n() i18n: I18nContext,
    @User() requestUser: RequestUser,
  ) {
    // 检测是否有上传文件的权限，没有则抛出异常不处理文件流
    const { value: hasCapability } = await this.userServiceClient
      .hasCapability({
        requestUserId: Number(requestUser.sub),
        capability: UserCapability.UploadFiles,
      })
      .lastValue();

    if (!hasCapability) {
      throw new ForbiddenError(
        i18n.tv('infrastructure-bff.media_resolver.upload_files_forbidden', 'No permission to upload files'),
      );
    }

    const result = await Promise.all(
      files.map(async (file) => {
        const { buffer, originalname, mimetype } = file;
        // 解决中文乱码问题，https://github.com/expressjs/multer/issues/1104
        const fileName = Buffer.from(originalname, 'latin1').toString('utf8');
        const fileBuffer = buffer;
        const md5 = await this.mediaService.getFileMd5(fileBuffer);
        let { media } = await this.mediaServiceClient
          .getByName({
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
          });
          ({ media } = await this.mediaServiceClient
            .create({
              fileName: md5FileName,
              originalFileName,
              extension,
              mimeType: mimetype,
              path,
              metaData,
              metas: [],
              requestUserId: Number(requestUser.sub),
            })
            .lastValue());
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

    return this.success({ data: result });
  }

  /**
   * crop image
   */
  @Post(':id/crop')
  @RamAuthorized(MediaAction.Upload)
  @UseInterceptors(FileInterceptor('file'))
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiBody({
    description: 'Image crop',
    type: ImageCropDto,
  })
  @ApiCreatedResponse({
    description: 'From template options',
    type: () =>
      createResponseSuccessType(
        { data: describeType(() => MediaModelResp, { description: 'File model' }) },
        'FormTemplateOptionModelsSuccessResp',
      ),
  })
  async cropImage(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: ImageCropDto,
    @I18n() i18n: I18nContext,
    @User() requestUser: RequestUser,
  ) {
    // 检测是否有编辑文件的权限，没有则抛出异常不处理文件流
    const { value: hasCapability } = await this.userServiceClient
      .hasCapability({
        requestUserId: Number(requestUser.sub),
        capability: UserCapability.EditFiles,
      })
      .lastValue();

    if (!hasCapability) {
      throw new ForbiddenError(
        i18n.tv('infrastructure-bff.media_resolver.edit_files_forbidden', 'No permission to edit files'),
      );
    }

    const { media } = await this.mediaServiceClient
      .get({
        id,
        fields: ['fileName', 'originalFileName', 'extension', 'mimeType', 'path', 'createdAt'],
      })
      .lastValue();

    if (media) {
      if (isAbsoluteUrl(media.path))
        throw new ForbiddenError(
          i18n.tv(
            'infrastructure-bff.media_controller.crop_absolute_image_forbidden',
            'Cannot crop absolute url image',
          ),
        );

      if (!this.mediaService.isCropable(media.mimeType)) {
        throw new ForbiddenError(
          i18n.tv(
            'infrastructure-bff.media_controller.crop_none_image_forbidden',
            `Cannot crop image with mimeType: ${media.mimeType}`,
            {
              args: {
                mimeType: media.mimeType,
              },
            },
          ),
        );
      }

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
          left: input.left,
          top: input.top,
          width: input.width,
          height: input.height,
        },
      });
      if (input.replace) {
        await this.mediaServiceClient
          .update({
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
        const { media: newMedia } = await this.mediaServiceClient
          .create({
            fileName: md5FileName,
            originalFileName,
            extension,
            mimeType: media.mimeType,
            path: filePath,
            metaData,
            metas: [],
            requestUserId: Number(requestUser.sub),
          })
          .lastValue();
        const { original, ...rest } = await this.mediaService.toFileModel(newMedia, newMedia.metaData);
        return this.success({
          data: {
            ...original,
            ...rest,
            id: newMedia.id,
            originalFileName: newMedia.originalFileName,
            extension: newMedia.extension,
            mimeType: newMedia.mimeType,
            createdAt: newMedia.createdAt,
          },
        });
      }
    }
    return this.faild(i18n.tv('infrastructure-bff.media_controller.crop_media_not_found', 'Media is not found!'));
  }

  /**
   * Get media
   */
  @Get(':id')
  @RamAuthorized(MediaAction.Detail)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Media model',
    type: () => createResponseSuccessType({ data: MediaModelResp }, 'MediaModelSuccessResp'),
  })
  async getMedia(@Param('id', ParseIntPipe) id: number) {
    const { media } = await this.mediaServiceClient
      .get({
        id,
        fields: ['id', 'fileName', 'originalFileName', 'extension', 'mimeType', 'path', 'createdAt'],
      })
      .lastValue();
    if (media) {
      const { original, ...rest } = await this.mediaService.toFileModel(media, media?.metaData);

      return this.success({
        data: {
          ...original,
          ...rest,
          id: media.id,
          originalFileName: media.originalFileName,
          extension: media.extension,
          mimeType: media.mimeType,
          createdAt: media.createdAt,
        },
      });
    }
    return this.success();
  }

  /**
   * Get medias
   */
  @Get()
  @RamAuthorized(MediaAction.PagedList)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Media model',
    type: () => createResponseSuccessType({ data: PagedMediaResp }, 'PagedMediaSuccessResp'),
  })
  async getMedias(@Query(ParseQueryPipe) query: PagedMediaQueryDto) {
    const { rows, ...rest } = await this.mediaServiceClient
      .getPaged({
        ...query,
        extensions: query.extensions || [],
        mimeTypes: query.mimeTypes || [],
        fields: ['id', 'fileName', 'originalFileName', 'extension', 'mimeType', 'path', 'createdAt'],
      })
      .lastValue();
    const formattedRows = await Promise.all(
      rows.map(async (media) => {
        const { original, ...rest } = await this.mediaService.toFileModel(media, media?.metaData);
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

    return this.success({
      data: {
        rows: formattedRows,
        ...rest,
      },
    });
  }

  /**
   * Create media
   */
  @Post()
  @RamAuthorized(MediaAction.Create)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiBody({
    description: 'New media model',
    type: NewMediaDto,
  })
  @ApiCreatedResponse({
    description: 'Media model',
    type: () => createResponseSuccessType({ data: MediaModelResp }, 'MediaModelSuccessResp'),
  })
  async createMedia(@Body() input: NewMediaDto, @User() requestUser: RequestUser) {
    const { media } = await this.mediaServiceClient
      .create({
        ...input,
        metas: [],
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();
    const { original, ...rest } = await this.mediaService.toFileModel(media, media?.metaData);
    return this.success({
      data: {
        ...original,
        ...rest,
        id: media.id,
        originalFileName: media.originalFileName,
        extension: media.extension,
        mimeType: media.mimeType,
        createdAt: media.createdAt,
      },
    });
  }

  /**
   * Update media
   */
  @Patch(':id')
  @RamAuthorized(MediaAction.Update)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiBody({
    description: 'Update media model',
    type: UpdateMediaDto,
  })
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}, 'UpdateMediaModelSuccessResp'),
  })
  async updateMedia(
    @Param('id', ParseIntPipe) id: number,
    @Body(
      new ValidatePayloadExistsPipe<UpdateMediaDto>({
        oneOf: ['fileName', 'originalFileName', 'extension', 'mimeType', 'path'],
      }),
    )
    input: UpdateMediaDto,
    @User() requestUser: RequestUser,
  ) {
    try {
      await this.mediaServiceClient
        .update({
          ...input,
          id,
          requestUserId: Number(requestUser.sub),
        })
        .lastValue();
      return this.success();
    } catch (e: any) {
      this.logger.error(e);
      return this.faild(e.message);
    }
  }
}
