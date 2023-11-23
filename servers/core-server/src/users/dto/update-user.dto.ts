import { ValidateIf, IsEnum, IsOptional, IsString, IsLocale } from 'class-validator';
import { PartialType, PickType } from '@nestjs/swagger';
import { UserRole, UserStatus } from '@ace-pomelo/datasource';
import { NewUserDto } from './new-user.dto';

export class UpdateUserDto extends PartialType(
  PickType(NewUserDto, ['firstName', 'lastName', 'url', 'avator', 'description', 'adminColor'] as const),
) {
  /**
   * Status
   */
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
