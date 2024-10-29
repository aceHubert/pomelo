import { IsEnum, IsOptional, IsString, IsLocale, IsDefined, MinLength } from 'class-validator';
import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { UserStatus, UserRole } from '@ace-pomelo/shared/server';
import { NewUserDto } from './new-user.dto';

export class UpdateUserDto extends PartialType(
  PickType(NewUserDto, ['firstName', 'lastName', 'url', 'avator', 'description', 'adminColor'] as const),
) {
  /**
   * Status
   */
  @ApiProperty({
    enum: UserStatus,
    required: false,
    description: 'Status',
  })
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

export class UpdateUserPasswordDto {
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
