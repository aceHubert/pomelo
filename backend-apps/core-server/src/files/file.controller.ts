import { ApiTags, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { ModuleRef } from '@nestjs/core';
import {
  Controller,
  Post,
  Scope,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  HttpStatus,
  Param,
  Get,
  Query,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { I18n, I18nContext } from 'nestjs-i18n';
import { Authorized } from 'nestjs-authorization';
import { RamAuthorized } from 'nestjs-ram-authorization';
import { MediaDataSource } from '@pomelo/datasource';
import {
  BaseController,
  User,
  ApiAuth,
  ParseQueryPipe,
  createResponseSuccessType,
  describeType,
  RequestUser,
} from '@pomelo/shared';
import { createMetaController } from '@/common/controllers/meta.controller';
import { MediaAction } from '@/common/actions';
import { FileService } from './file.service';
import { PagedMediaQueryDto } from './dto/media-query.dto';
import { NewMediaMetaDto } from './dto/new-media-meta.dto';
import { PagedMediaResp, MediaModelResp, MediaMetaModelResp } from './resp/file-model.resp';

/**
 * 文件上传 Restful Api 控制器
 */
@ApiTags('resources')
@Authorized()
@Controller({ path: 'api/file', scope: Scope.REQUEST })
export class FileController extends BaseController {
  constructor(private readonly fileService: FileService) {
    super();
  }

  /**
   * upload single file
   */
  @Post('upload')
  @RamAuthorized(MediaAction.Upload)
  @UseInterceptors(FileInterceptor('file'))
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiCreatedResponse({
    description: 'From template options',
    type: () =>
      createResponseSuccessType(
        { data: describeType(() => MediaModelResp, { description: 'File model' }) },
        'FormTemplateOptionModelsSuccessResp',
      ),
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @I18n() i18n: I18nContext,
    @User() requestUser: RequestUser,
  ) {
    const media = await this.fileService.uploadFile(
      {
        file: file.path || file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
      },
      requestUser,
    );
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
   * upload multiple files
   */
  @Post('upload-multi')
  @RamAuthorized(MediaAction.Upload)
  @UseInterceptors(FilesInterceptor('files'))
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiCreatedResponse({
    description: 'From template options',
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
        const media = await this.fileService.uploadFile(
          {
            file: file.path || file.buffer,
            originalName: file.originalname,
            mimeType: file.mimetype,
          },
          requestUser,
        );

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

    return this.success({ data: result });
  }
}

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
    private readonly fileService: FileService,
    private readonly mediaDataSource: MediaDataSource,
  ) {
    super(moduleRef);
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
  async getMedia(@Param('id') id: number) {
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
}
