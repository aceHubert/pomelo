import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AuthProvider } from '@ace-pomelo/shared/server';

@InputType()
export class SocialAuthStartInput {
  @Field(() => AuthProvider)
  @ApiProperty({ enum: AuthProvider, description: '第三方登录平台' })
  @IsEnum(AuthProvider)
  provider!: AuthProvider;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: '认证完成后回跳地址' })
  @IsOptional()
  @IsString()
  returnUrl?: string;
}

@InputType()
export class SocialAuthCompleteInput {
  @Field(() => AuthProvider)
  @ApiProperty({ enum: AuthProvider, description: '第三方登录平台' })
  @IsEnum(AuthProvider)
  provider!: AuthProvider;

  @Field()
  @ApiProperty({ description: 'OAuth 授权码' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @Field()
  @ApiProperty({ description: 'OAuth state' })
  @IsString()
  @IsNotEmpty()
  state!: string;
}
