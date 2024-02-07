import { ValidateIf, IsEnum, IsOptional, IsString, IsLocale } from 'class-validator';
import { ApiProperty, ApiHideProperty, PartialType, PickType } from '@nestjs/swagger';
import { UserStatus } from '@ace-pomelo/infrastructure-datasource';
import { UserRole } from '../enums/user-role.enum';
import { NewUserDto } from './new-user.dto';

export class UpdateUserDto extends PartialType(
  PickType(NewUserDto, ['firstName', 'lastName', 'url', 'avator', 'description', 'adminColor'] as const),
) {
  /**
   * Status
   */
  @ApiHideProperty() // FIX: Hide from nest-cli plugin, enum compile to relative path from packages
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
   * Capabilities, set null to forbidden all capabilities
   */
  @IsOptional()
  @ValidateIf((o) => o.capabilities !== null)
  @IsEnum(UserRole)
  capabilities?: UserRole | null;

  /**
   * Locale, set null to reset as using site default locale
   */
  @IsOptional()
  @ValidateIf((o) => o.locale !== null)
  @IsLocale()
  locale?: string | null;
}
