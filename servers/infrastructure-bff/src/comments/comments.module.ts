import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentResolver } from './comment.resolver';
import './enums/registered.enum';

@Module({
  controllers: [CommentController],
  providers: [CommentResolver],
})
export class CommentsModule {}
