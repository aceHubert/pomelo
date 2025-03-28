import { Controller } from '@nestjs/common';
import { Empty } from '@ace-pomelo/shared/server/proto-ts/google/protobuf/empty';
import {
  CommentServiceControllerMethods,
  CommentServiceController,
  GetCommentRequest,
  GetCommentResponse,
  GetPagedCommentRequest,
  GetPagedCommentResponse,
  CreateCommentRequest,
  CreateCommentResponse,
  UpdateCommentRequest,
  DeleteCommentRequest,
} from '@ace-pomelo/shared/server/proto-ts/comment';
import { WrapperCommentType } from '@/common/utils/wrapper-enum.util';
import { CommentDataSource } from '../datasource';
import { createMetaController } from './meta.controller';

@Controller()
@CommentServiceControllerMethods()
export class CommentController extends createMetaController('comment') implements CommentServiceController {
  constructor(private readonly commentDataSource: CommentDataSource) {
    super(commentDataSource);
  }

  get({ fields, id }: GetCommentRequest): Promise<GetCommentResponse> {
    return this.commentDataSource.get(id, fields).then((result) => {
      return { comment: result };
    });
  }

  getPaged({ fields, ...query }: GetPagedCommentRequest): Promise<GetPagedCommentResponse> {
    return this.commentDataSource.getPaged(query, fields);
  }

  create({ requestUserId, ...model }: CreateCommentRequest): Promise<CreateCommentResponse> {
    return this.commentDataSource
      .create({ ...model, type: WrapperCommentType.asValueOrDefault(model.type, void 0) }, requestUserId)
      .then((result) => {
        return { comment: result };
      });
  }

  update({ id, requestUserId, ...model }: UpdateCommentRequest): Promise<Empty> {
    return this.commentDataSource.update(id, model, requestUserId).then(() => {
      return {};
    });
  }

  delete({ id, requestUserId }: DeleteCommentRequest): Promise<Empty> {
    return this.commentDataSource.delete(id, requestUserId).then(() => {
      return {};
    });
  }
}
