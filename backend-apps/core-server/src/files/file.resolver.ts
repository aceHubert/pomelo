import { ModuleRef } from '@nestjs/core';
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { FileUpload } from 'graphql-upload/Upload.js';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.js';
import { Authorized } from 'nestjs-authorization';
import { RamAuthorized } from 'nestjs-ram-authorization';
import { ResolveTree } from 'graphql-parse-resolve-info';
import { MediaDataSource } from '@pomelo/datasource';
import { Fields, User, RequestUser } from '@pomelo/shared';
import { createMetaResolver } from '@/common/resolvers/meta.resolver';
import { MediaAction } from '@/common/actions';
import { FileService } from './file.service';
import { PagedMediaArgs } from './dto/media.args';
import { NewMediaMetaInput } from './dto/new-media-meta.input';
import { PagedMedia, Media, MediaMeta } from './models/file.model';

@Authorized()
@Resolver(() => Media)
export class FileResolver extends createMetaResolver(Media, MediaMeta, NewMediaMetaInput, MediaDataSource) {
  constructor(
    protected readonly moduleRef: ModuleRef,
    private readonly fileService: FileService,
    private readonly mediaDataSource: MediaDataSource,
  ) {
    super(moduleRef);
  }

  @Mutation(() => Media)
  @RamAuthorized(MediaAction.Upload)
  async uploadFile(
    @Args('file', { type: () => GraphQLUpload }) file: FileUpload,
    @User() requestUser: RequestUser,
  ): Promise<Media> {
    const { createReadStream, filename, mimetype } = await file;

    const stream = createReadStream();

    const buffers = [];
    for await (const chunk of stream) {
      buffers.push(chunk);
    }

    const media = await this.fileService.uploadFile(
      {
        file: Buffer.concat(buffers),
        originalName: filename,
        mimeType: mimetype,
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

        const media = await this.fileService.uploadFile(
          {
            file: Buffer.concat(buffers),
            originalName: filename,
            mimeType: mimetype,
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

    return {
      rows: formattedRows,
      ...rest,
    };
  }
}
