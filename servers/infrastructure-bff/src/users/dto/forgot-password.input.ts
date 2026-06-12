import { ApiProperty } from '@nestjs/swagger';
import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

@InputType()
export class ForgotPasswordEmailCodeInput {
  @Field()
  @ApiProperty({ description: '用户名/邮箱/手机号' })
  @IsString()
  @IsNotEmpty()
  username!: string;
}

@InputType()
export class ResetPasswordInput {
  @Field()
  @ApiProperty({ description: '用户名/邮箱/手机号' })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @Field()
  @ApiProperty({ description: '邮箱验证码' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @Field()
  @ApiProperty({ description: '前端 SHA-256 后的新密码' })
  @IsString()
  @MinLength(6)
  password!: string;
}
