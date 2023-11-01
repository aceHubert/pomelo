import * as path from 'path';
import { ApiTags, ApiBody, ApiConsumes, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { ModuleRef } from '@nestjs/core';
import {
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
  Inject,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { I18n, I18nContext } from 'nestjs-i18n';
import { Authorized } from '@pomelo/authorization';
import { RamAuthorized } from '@pomelo/ram-authorization';
import { MediaDataSource } from '@pomelo/datasource';
import {
  User,
  ApiAuth,
  ParseQueryPipe,
  ValidatePayloadExistsPipe,
  createResponseSuccessType,
  describeType,
  RequestUser,
} from '@pomelo/shared-server';
import { isAbsoluteUrl } from '@/common/utils/path.util';
import { createMetaController } from '@/common/controllers/meta.controller';
import { MediaAction } from '@/common/actions';
import { FixedMediaOptions } from './interfaces/media-options.interface';
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
export class MediaController extends createMetaController(
  'media',
  MediaMetaModelResp,
  NewMediaMetaDto,
  MediaDataSource,
  {
    authDecorator: ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN]),
  },
) {
  constructor(
    protected readonly moduleRef: ModuleRef,
    private readonly fileService: MediaService,
    private readonly mediaDataSource: MediaDataSource,
    @Inject(MEDIA_OPTIONS) private readonly fileOptions: FixedMediaOptions,
  ) {
    super(moduleRef);
  }

  /**
   * upload single file
   */
  @Post('upload')
  @RamAuthorized(MediaAction.Upload)
  @UseInterceptors(FileInterceptor('file'))
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
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
    // 解决中文乱码问题，https://github.com/expressjs/multer/issues/1104
    const fileName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const fileBuffer = file.buffer;
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
      const { originalFileName, extension, path, metaData } = await this.fileService.saveFile(file.buffer, {
        originalName: options?.fileName || fileName,
        mimeType: file.mimetype,
        crop: options?.crop,
      });
      media = await this.mediaDataSource.create(
        {
          fileName: md5,
          originalFileName: originalFileName,
          extension,
          mimeType: file.mimetype,
          path,
        },
        metaData,
        requestUser,
      );
    }
    const { original, ...rest } = await this.fileService.toFileModel(media, media.metaData);

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
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
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
    const result = await Promise.all(
      files.map(async (file) => {
        // 解决中文乱码问题，https://github.com/expressjs/multer/issues/1104
        const fileName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const fileBuffer = file.buffer;
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
            mimeType: file.mimetype,
          });
          media = await this.mediaDataSource.create(
            {
              fileName: md5,
              originalFileName: originalFileName,
              extension,
              mimeType: file.mimetype,
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

    return this.success({ data: result });
  }

  /**
   * crop image
   */
  @Post('image/crop')
  @RamAuthorized(MediaAction.Upload)
  @UseInterceptors(FileInterceptor('file'))
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
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
  async cropImage(@Body() input: ImageCropDto, @I18n() i18n: I18nContext, @User() requestUser: RequestUser) {
    const media = await this.mediaDataSource.get(input.id, [
      'originalFileName',
      'fileName',
      'path',
      'extension',
      'mimeType',
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
          left: input.left,
          top: input.top,
          width: input.width,
          height: input.height,
        },
      });
      if (input.replace) {
        await this.mediaDataSource.update(
          input.id,
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
    return this.faild(i18n.tv('media.crop.media_not_found', 'Media is not found!'));
  }

  /**
   * Get media
   */
  @Get(':id')
  @RamAuthorized(MediaAction.Detail)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Media model',
    type: () => createResponseSuccessType({ data: MediaModelResp }, 'MediaModelSuccessResp'),
  })
  async getMedia(@Param('id', ParseIntPipe) id: number) {
    const media = await this.mediaDataSource.get(id, [
      'id',
      'fileName',
      'originalFileName',
      'extension',
      'mimeType',
      'path',
      'createdAt',
    ]);
    if (media) {
      const { original, ...rest } = await this.fileService.toFileModel(media, media?.metaData);

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
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Media model',
    type: () => createResponseSuccessType({ data: PagedMediaResp }, 'PagedMediaSuccessResp'),
  })
  async getMedias(@Query(ParseQueryPipe) query: PagedMediaQueryDto) {
    const { rows, ...rest } = await this.mediaDataSource.getPaged(query, [
      'id',
      'fileName',
      'originalFileName',
      'extension',
      'mimeType',
      'path',
      'createdAt',
    ]);

    const formattedRows = await Promise.all(
      rows.map(async (media) => {
        const { original, ...rest } = await this.fileService.toFileModel(media, media?.metaData);
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
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiBody({
    description: 'New media model',
    type: NewMediaDto,
  })
  @ApiCreatedResponse({
    description: 'Media model',
    type: () => createResponseSuccessType({ data: MediaModelResp }, 'MediaModelSuccessResp'),
  })
  async createMedia(@Body() { metaData, ...model }: NewMediaDto, @User() user: RequestUser) {
    const media = await this.mediaDataSource.create(model, metaData, user);
    const { original, ...rest } = await this.fileService.toFileModel(media, media?.metaData);
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
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
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
    { metaData, ...model }: UpdateMediaDto,
    @User() user: RequestUser,
  ) {
    await this.mediaDataSource.update(id, model, metaData ?? 'NONE', user);
    return this.success();
  }
}
