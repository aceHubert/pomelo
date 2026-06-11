import { ApiProperty } from '@nestjs/swagger';
import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

@InputType()
export class RegisterEmailCodeInput {
  @Field()
  @ApiProperty({ description: '注册邮箱' })
  @IsEmail()
  email!: string;
}

@InputType()
export class RegisterInput {
  @Field()
  @ApiProperty({ description: '注册邮箱' })
  @IsEmail()
  email!: string;

  @Field()
  @ApiProperty({ description: '邮箱验证码' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @Field()
  @ApiProperty({ description: '登录名' })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @Field()
  @ApiProperty({ description: '前端 SHA-256 后的密码' })
  @IsString()
  @MinLength(6)
  password!: string;
}
