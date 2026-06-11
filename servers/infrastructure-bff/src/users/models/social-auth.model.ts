import { Field, ObjectType } from '@nestjs/graphql';
import { AuthProvider } from '@ace-pomelo/shared/server';

@ObjectType({ description: 'Social auth start result' })
export class SocialAuthStartResult {
  @Field(() => AuthProvider)
  provider!: AuthProvider;

  @Field()
  authorizationUrl!: string;

  @Field()
  state!: string;
}
