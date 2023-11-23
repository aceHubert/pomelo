import { Field, InputType, ID } from '@nestjs/graphql';
import { NewMediaMetaInput as INewMediaMetaInput } from '@ace-pomelo/datasource';
import { NewMetaInput } from '@/common/resolvers/dto/new-meta.input';

@InputType({ description: 'New media meta input' })
export class NewMediaMetaInput extends NewMetaInput implements INewMediaMetaInput {
  @Field(() => ID, { description: 'Media Id' })
  mediaId!: number;
}
