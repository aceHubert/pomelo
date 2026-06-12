import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Forgot password email code result' })
export class ForgotPasswordEmailCodeResult {
  @Field()
  success!: boolean;

  @Field()
  expiresInSeconds!: number;

  @Field()
  cooldownSeconds!: number;

  @Field()
  maskedEmail!: string;

  @Field({ nullable: true })
  message?: string;
}

@ObjectType({ description: 'Reset password result' })
export class ResetPasswordResult {
  @Field()
  success!: boolean;

  @Field({ nullable: true })
  message?: string;
}
