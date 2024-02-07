import { ValidateIf, IsEnum, IsOptional, IsString, IsLocale } from 'class-validator';
import { InputType, Field, PartialType, PickType } from '@nestjs/graphql';
import { UserStatus } from '@ace-pomelo/infrastructure-datasource';
import { UserRole } from '../enums/user-role.enum';
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
   * Capabilities, set null to forbidden all capabilities
   */
  @Field((type) => UserRole)
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
