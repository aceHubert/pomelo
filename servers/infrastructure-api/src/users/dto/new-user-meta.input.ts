import { Field, InputType, ID } from '@nestjs/graphql';
import { NewUserMetaInput as INewUserMetaInput } from '@ace-pomelo/infrastructure-datasource';
import { NewMetaInput } from '@/common/resolvers/dto/new-meta.input';

@InputType({ description: 'New user meta input' })
export class NewUserMetaInput extends NewMetaInput implements INewUserMetaInput {
  /**
   * User Id
   */
  @Field(() => ID)
  userId!: number;
}
