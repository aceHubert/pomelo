import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Register email code result' })
export class RegisterEmailCodeResult {
  @Field()
  success!: boolean;

  @Field()
  expiresInSeconds!: number;

  @Field()
  cooldownSeconds!: number;

  @Field({ nullable: true })
  message?: string;
}
