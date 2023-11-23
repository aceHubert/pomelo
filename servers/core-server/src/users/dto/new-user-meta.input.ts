import { Field, InputType, ID } from '@nestjs/graphql';
import { NewUserMetaInput as INewUserMetaInput } from '@ace-pomelo/datasource';
import { NewMetaInput } from '@/common/resolvers/dto/new-meta.input';

@InputType({ description: 'New user meta input' })
export class NewUserMetaInput extends NewMetaInput implements INewUserMetaInput {
  @Field(() => ID, { description: 'User Id' })
  userId!: number;
}
