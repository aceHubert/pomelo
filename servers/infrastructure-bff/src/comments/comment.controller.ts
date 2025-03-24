import { Response } from 'express';
import { ApiTags, ApiOkResponse, ApiCreatedResponse, ApiNoContentResponse } from '@nestjs/swagger';
import {
  Inject,
  Controller,
  Query,
  Param,
  Body,
  Get,
  Post,
  Put,
  Delete,
  ParseIntPipe,
  Res,
  HttpStatus,
  OnModuleInit,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Authorized, Anonymous } from '@ace-pomelo/nestjs-authorization';
import { RamAuthorized } from '@ace-pomelo/nestjs-ram-authorization';
import {
  createResponseSuccessType,
  User,
  ApiAuthCreate,
  ParseQueryPipe,
  ValidatePayloadExistsPipe,
  RequestUser,
  POMELO_SERVICE_PACKAGE_NAME,
} from '@ace-pomelo/shared/server';
import {} from '@ace-pomelo/shared/server/proto-ts';
import { CommentServiceClient, COMMENT_SERVICE_NAME } from '@ace-pomelo/shared/server/proto-ts/comment';
import { CommentAction } from '@/common/actions';
import { createMetaController } from '@/common/controllers/meta.controller';
import { PagedCommentQueryDto } from './dto/comment-query.dto';
import { NewCommentMetaDto } from './dto/new-comment-meta.dto';
import { NewCommentDto } from './dto/new-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentModelResp, CommentMetaModelResp, PagedCommentResp } from './resp/comment-model.resp';

@ApiTags('comments')
@Authorized()
@Controller('api/comments')
export class CommentController
  extends createMetaController('comment', CommentMetaModelResp, NewCommentMetaDto, {
    authDecorator: (method) => {
      const ramAction =
        method === 'getMeta'
          ? CommentAction.MetaDetail
          : method === 'getMetas'
          ? CommentAction.MetaList
          : method === 'createMeta' || method === 'createMetas'
          ? CommentAction.MetaCreate
          : method === 'updateMeta' || method === 'updateMetaByKey'
          ? CommentAction.MetaUpdate
          : CommentAction.MetaDelete;

      return [RamAuthorized(ramAction), ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])];
    },
  })
  implements OnModuleInit
{
  private commentServiceClient!: CommentServiceClient;

  constructor(@Inject(POMELO_SERVICE_PACKAGE_NAME) private readonly client: ClientGrpc) {
    super();
  }

  onModuleInit() {
    this.commentServiceClient = this.client.getService<CommentServiceClient>(COMMENT_SERVICE_NAME);
  }

  get metaServiceClient() {
    return this.commentServiceClient;
  }

  /**
   * Get comment.
   */
  @Get(':id')
  @Anonymous()
  @ApiOkResponse({
    description: 'Comment model',
    type: () => createResponseSuccessType({ data: CommentModelResp }, 'CommentModelSuccessResp'),
  })
  @ApiNoContentResponse({ description: 'Comment not found' })
  async get(@Param('id', ParseIntPipe) id: number, @Res({ passthrough: true }) res: Response) {
    const { comment } = await this.commentServiceClient
      .get({
        id,
        fields: [
          'id',
          'templateId',
          'author',
          'authorEmail',
          'authorUrl',
          'authorIp',
          'content',
          'approved',
          'edited',
          'type',
          'agent',
          'parentId',
          'userId',
          'createdAt',
          'updatedAt',
        ],
      })
      .lastValue();

    if (!comment) {
      res.status(HttpStatus.NO_CONTENT);
    }

    return this.success({
      data: comment,
    });
  }

  /**
   * Get comments with pagination.
   */
  @Get()
  @Anonymous()
  @ApiOkResponse({
    description: 'Comment models with pagination',
    type: () => createResponseSuccessType({ data: PagedCommentResp }, 'PagedCommentModelSuccessResp'),
  })
  async getPaged(@Query(ParseQueryPipe) query: PagedCommentQueryDto) {
    const result = await this.commentServiceClient
      .getPaged({
        ...query,
        fields: [
          'id',
          'templateId',
          'author',
          'authorEmail',
          'authorUrl',
          'authorIp',
          'content',
          'approved',
          'edited',
          'type',
          'agent',
          'parentId',
          'userId',
          'createdAt',
          'updatedAt',
        ],
      })
      .lastValue();

    return this.success({
      data: result,
    });
  }

  /**
   * Create a new comment.
   */
  @Post()
  @Anonymous()
  @ApiCreatedResponse({
    description: 'Comment model',
    type: () => createResponseSuccessType({ data: CommentModelResp }, 'CommentModelSuccessResp'),
  })
  async create(@Body() input: NewCommentDto, @User() requestUser: RequestUser) {
    const { comment } = await this.commentServiceClient
      .create({
        ...input,
        metas: [],
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();

    return this.success({
      data: comment,
    });
  }

  /**
   * Update comment.
   */
  @Put(':id')
  @RamAuthorized(CommentAction.Update)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}, 'UpdateCommentModelSuccessResp'),
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidatePayloadExistsPipe) input: UpdateCommentDto,
    @User() requestUser: RequestUser,
  ) {
    try {
      await this.commentServiceClient
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

  /**
   * Delete comment.
   */
  @Delete(':id')
  @RamAuthorized(CommentAction.Delete)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Success response',
    type: () => createResponseSuccessType({}, 'DeleteCommentModelSuccessResp'),
  })
  async delete(@Param('id', ParseIntPipe) id: number, @User() requestUser: RequestUser) {
    try {
      await this.commentServiceClient
        .delete({
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
