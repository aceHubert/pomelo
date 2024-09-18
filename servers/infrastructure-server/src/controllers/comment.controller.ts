import { Controller, ParseIntPipe, ParseArrayPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CommentPattern } from '@ace-pomelo/shared/server';
import { CommentDataSource, CommentModel, PagedCommentModel } from '../datasource';
import { NewCommentPayload, PagedCommentQueryPayload, UpdateCommentPayload } from './payload/comment.payload';

@Controller()
export class CommentController {
  constructor(private readonly commentDataSource: CommentDataSource) {}

  @MessagePattern(CommentPattern.Get)
  get(
    @Payload('id', ParseIntPipe) id: number,
    @Payload('fields', new ParseArrayPipe({ items: String })) fields: string[],
  ): Promise<CommentModel | undefined> {
    return this.commentDataSource.get(id, fields);
  }

  @MessagePattern(CommentPattern.GetPaged)
  getPaged(
    @Payload('query') query: PagedCommentQueryPayload,
    @Payload('fields', new ParseArrayPipe({ items: String })) fields: string[],
  ): Promise<PagedCommentModel> {
    return this.commentDataSource.getPaged(query, fields);
  }

  @MessagePattern(CommentPattern.Create)
  create(@Payload() payload: NewCommentPayload): Promise<CommentModel> {
    const { requestUserId, ...model } = payload;
    return this.commentDataSource.create(model, requestUserId);
  }

  @MessagePattern(CommentPattern.Update)
  update(@Payload() payload: UpdateCommentPayload): Promise<void> {
    const { id, requestUserId, ...model } = payload;
    return this.commentDataSource.update(id, model, requestUserId);
  }

  @MessagePattern(CommentPattern.Delete)
  delete(
    @Payload('id', ParseIntPipe) id: number,
    @Payload('requestUserId', ParseIntPipe) requestUserId: number,
  ): Promise<void> {
    return this.commentDataSource.delete(id, requestUserId);
  }
}
