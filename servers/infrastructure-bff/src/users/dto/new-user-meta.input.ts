import { Field, InputType, ID } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { NewMetaInput } from '@/common/resolvers/dto/new-meta.input';

@InputType({ description: 'New user meta input' })
export class NewUserMetaInput extends NewMetaInput {
  /**
   * User Id
   */
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
  userId!: number;
}
