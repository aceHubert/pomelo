import { Inject, ParseIntPipe, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ResolveTree } from 'graphql-parse-resolve-info';
import { VoidResolver } from 'graphql-scalars';
import { Authorized, Anonymous } from '@ace-pomelo/nestjs-authorization';
import { RamAuthorized } from '@ace-pomelo/nestjs-ram-authorization';
import { User, Fields, RequestUser, CommentType, POMELO_SERVICE_PACKAGE_NAME } from '@ace-pomelo/shared/server';
import { CommentServiceClient, COMMENT_SERVICE_NAME, CommentModel } from '@ace-pomelo/shared/server/proto-ts/comment';
import { CommentAction } from '@/common/actions';
import { createMetaResolver } from '@/common/resolvers/meta.resolver';
import { WrapperCommentType } from '@/common/utils/wrapper-enum.util';
import { NewCommentInput } from './dto/new-comment.input';
import { NewCommentMetaInput } from './dto/new-comment-meta.input';
import { CommentArgs } from './dto/comment.args';
import { UpdateCommentInput } from './dto/update-comment.input';
import { Comment, CommentMeta, PagedComment } from './models/comment.model';

@Authorized()
@Resolver(() => Comment)
export class CommentResolver
  extends createMetaResolver('comment', Comment, CommentMeta, NewCommentMetaInput, {
    authDecorator: (method) => {
      const ramAction =
        method === 'getMeta'
          ? CommentAction.MetaDetail
          : method === 'getMetas' || method === 'fieldMetas'
          ? CommentAction.MetaList
          : method === 'createMeta' || method === 'createMetas'
          ? CommentAction.MetaCreate
          : method === 'updateMeta' || method === 'updateMetaByKey'
          ? CommentAction.MetaUpdate
          : CommentAction.MetaDelete;

      return RamAuthorized(ramAction);
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

  private mapToComment(model: CommentModel): Comment {
    return {
      ...model,
      type: WrapperCommentType.asValueOrDefault(model.type, CommentType.Comment),
    };
  }

  @Anonymous()
  @Query(() => Comment, { nullable: true, description: 'Get comment.' })
  async comment(@Args('id', ParseIntPipe) id: number, @Fields() fields: ResolveTree): Promise<Comment | undefined> {
    const { comment } = await this.commentServiceClient
      .get({
        id,
        fields: this.getFieldNames(fields.fieldsByTypeName.Comment),
      })
      .lastValue();
    return comment ? this.mapToComment(comment) : undefined;
  }

  @Anonymous()
  @Query(() => [PagedComment], { description: 'Get paged comment.' })
  async comments(
    @Args({ type: () => CommentArgs }) args: CommentArgs,
    @Fields() fields: ResolveTree,
  ): Promise<PagedComment> {
    return this.commentServiceClient
      .getPaged({
        ...args,
        fields: this.getFieldNames(fields.fieldsByTypeName.Comment),
      })
      .lastValue()
      .then(({ rows, ...rest }) => ({
        ...rest,
        rows: rows.map((row) => this.mapToComment(row)),
      }));
  }

  @Anonymous()
  @Mutation(() => Comment, { description: 'Create a new comment.' })
  async createComment(
    @Args('model', { type: () => NewCommentInput }) model: NewCommentInput,
    @User() requestUser: RequestUser,
  ): Promise<Comment> {
    const { comment } = await this.commentServiceClient
      .create({
        ...model,
        metas: model.metas || [],
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();
    return this.mapToComment(comment);
  }

  @RamAuthorized(CommentAction.Update)
  @Mutation(() => VoidResolver, { nullable: true, description: 'Update comment.' })
  async updateComment(
    @Args('id', { type: () => ID }, ParseIntPipe) id: number,
    @Args('model', { type: () => UpdateCommentInput }) model: UpdateCommentInput,
    @User() requestUser: RequestUser,
  ): Promise<void> {
    await this.commentServiceClient
      .update({
        ...model,
        id,
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();
  }

  @RamAuthorized(CommentAction.Delete)
  @Mutation(() => VoidResolver, { nullable: true, description: 'Delete comment permanently.' })
  async deleteComment(@Args('id', ParseIntPipe) id: number, @User() requestUser: RequestUser): Promise<void> {
    await this.commentServiceClient
      .delete({
        id,
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();
  }
}
