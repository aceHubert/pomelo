import { IsEnum, IsOptional, IsString, IsLocale, IsDefined, MinLength } from 'class-validator';
import { ID, InputType, Field, PartialType, PickType } from '@nestjs/graphql';
import { UserStatus, UserRole } from '@ace-pomelo/shared/server';
import { NewUserInput } from './new-user.input';

@InputType({ description: 'Update user input' })
export class UpdateUserInput extends PartialType(
  PickType(NewUserInput, ['firstName', 'lastName', 'url', 'avator', 'description', 'adminColor'] as const),
) {
  /**
   * User status
   */
  @Field((type) => UserStatus)
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  /**
   * Display name
   */
  @IsOptional()
  @IsString()
  displayName?: string;

  /**
   * Nick name
   */
  @IsOptional()
  @IsString()
  nickName?: string;

  /**
   * User Role
   */
  @Field((type) => UserRole)
  @IsOptional()
  @IsEnum(UserRole)
  capabilities?: UserRole;

  /**
   * Locale
   */
  @IsOptional()
  @IsLocale()
  locale?: string;
}

@InputType({ description: 'Update user password input' })
export class UpdateUserPasswordInput {
  /**
   * User name
   */
  @IsDefined()
  @IsString()
  username!: string;

  /**
   * Old password
   */
  @IsDefined()
  @IsString()
  oldPwd!: string;

  /**
   * New password
   */
  @IsDefined()
  @IsString()
  @MinLength(6)
  newPwd!: string;
}

@InputType({ description: 'Reset user password input' })
export class ResetUserPasswordInput {
  /**
   * User Id
   */
  @Field(() => ID)
  userId!: number;

  /**
   * New password
   */
  @IsDefined()
  @IsString()
  @MinLength(6)
  newPwd!: string;
}
