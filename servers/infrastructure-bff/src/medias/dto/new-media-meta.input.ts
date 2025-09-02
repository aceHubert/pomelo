import { Field, InputType, ID } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { NewMetaInput } from '@/common/resolvers/dto/new-meta.input';

@InputType({ description: 'New media meta input' })
export class NewMediaMetaInput extends NewMetaInput {
  /**
   * Media Id
   */
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
  mediaId!: number;
}
