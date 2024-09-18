import { Field, InputType, ID } from '@nestjs/graphql';
import { NewMetaInput } from '@/common/resolvers/dto/new-meta.input';

@InputType({ description: 'New user meta input' })
export class NewUserMetaInput extends NewMetaInput {
  /**
   * User Id
   */
  @Field(() => ID)
  userId!: number;
}
