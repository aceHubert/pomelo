import { Field, ID, ObjectType } from '@nestjs/graphql';
import { DateTimeISOResolver } from 'graphql-scalars';
import { CommentType } from '@ace-pomelo/shared/server';
import { Meta } from '@/common/resolvers/models/meta.model';
import { PagedResponse } from '@/common/resolvers/models/paged.model';

@ObjectType({ description: 'Comment model' })
export class Comment {
  /**
   * Comment ID
   */
  @Field((type) => ID)
  id!: number;

  /**
   * Template ID
   */
  @Field((type) => ID)
  templateId!: number;

  /**
   * Author name
   */
  author!: string;

  /**
   * Author email
   */
  authorEmail?: string;

  /**
   * Author URL
   */
  authorUrl?: string;

  /**
   * Author IP
   */
  authorIp?: string;

  /**
   * Comment content
   */
  content!: string;

  /**
   * Is approved
   */
  approved!: boolean;

  /**
   * Is edited
   */
  edited!: boolean;

  /**
   * Comment type
   */
  @Field((type) => CommentType)
  type!: CommentType;

  /**
   * User agent
   */
  agent?: string;

  /**
   * Parent comment ID
   */
  @Field((type) => ID)
  parentId!: number;

  /**
   * User ID
   */
  @Field((type) => ID)
  userId!: number;

  /**
   * Created time
   */
  @Field(() => DateTimeISOResolver)
  createdAt!: Date;

  /**
   * Updated time
   */
  @Field(() => DateTimeISOResolver)
  updatedAt!: Date;
}

@ObjectType({ description: 'Paged comment model' })
export class PagedComment extends PagedResponse(Comment) {}

@ObjectType({ description: 'Comment meta' })
export class CommentMeta extends Meta {
  /**
   * Comment ID
   */
  @Field((type) => ID)
  commentId!: number;
}
