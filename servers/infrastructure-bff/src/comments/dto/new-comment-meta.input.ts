import { Field, InputType, ID } from '@nestjs/graphql';
import { NewMetaInput } from '@/common/resolvers/dto/new-meta.input';

@InputType({ description: 'New comment meta input' })
export class NewCommentMetaInput extends NewMetaInput {
  /**
   * Comment Id
   */
  @Field(() => ID)
  commentId!: number;
}
