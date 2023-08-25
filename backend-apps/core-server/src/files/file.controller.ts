import { ApiTags, ApiCreatedResponse } from '@nestjs/swagger';
import { Controller, Post, Scope, UseInterceptors, UploadedFile, UploadedFiles, HttpStatus } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { I18n, I18nContext } from 'nestjs-i18n';
import { Authorized } from 'nestjs-authorization';
import { BaseController, User, ApiAuth, createResponseSuccessType, describeType, RequestUser } from '@pomelo/shared';
import { FileService } from './file.service';
import { FileModelResp } from './resp/file-model.resp';

/**
 * 文件上传 Restful Api 控制器
 */
@ApiTags('resources')
@Authorized()
@Controller({ path: 'file', scope: Scope.REQUEST })
export class FileController extends BaseController {
  constructor(private readonly fileService: FileService) {
    super();
  }

  /**
   * upload single file
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiCreatedResponse({
    description: 'From template options',
    type: () =>
      createResponseSuccessType(
        { data: describeType(() => ({ original: FileModelResp }), { description: 'File' }) },
        'FormTemplateOptionModelsSuccessResp',
      ),
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @I18n() i18n: I18nContext,
    @User() requestUser: RequestUser,
  ) {
    const result = await this.fileService.uploadFile(
      {
        file: file.path || file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
      },
      requestUser,
    );
    const resp = await Object.keys(result).reduce(async (prev, key) => {
      const _prev = await prev;
      _prev[key] = {
        filename: result[key].fileName,
        url: await this.fileService.getURI(result[key].path),
      };
      return _prev;
    }, Promise.resolve({}) as Promise<Dictionary<any>>);
    return this.success({ data: resp });
  }

  /**
   * upload multiple files
   */
  @Post('upload-multi')
  @UseInterceptors(FilesInterceptor('files'))
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiCreatedResponse({
    description: 'From template options',
    type: () =>
      createResponseSuccessType(
        { data: describeType(() => [{ original: FileModelResp }], { description: 'Files' }) },
        'FormTemplateOptionModelsSuccessResp',
      ),
  })
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @I18n() i18n: I18nContext,
    @User() requestUser: RequestUser,
  ) {
    const result = await Promise.all(
      files.map((file) =>
        this.fileService.uploadFile(
          {
            file: file.path || file.buffer,
            originalName: file.originalname,
            mimeType: file.mimetype,
          },
          requestUser,
        ),
      ),
    );
    const resp = await Promise.all(
      result.map((item) =>
        Object.keys(item).reduce(async (prev, key) => {
          const _prev = await prev;
          _prev[key] = {
            filename: item[key].fileName,
            url: await this.fileService.getURI(item[key].path),
          };
          return _prev;
        }, Promise.resolve({}) as Promise<Dictionary<any>>),
      ),
    );
    return this.success({ data: resp });
  }
}
