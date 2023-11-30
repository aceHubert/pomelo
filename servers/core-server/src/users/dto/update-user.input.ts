import { ValidateIf, IsEnum, IsOptional, IsString, IsLocale } from 'class-validator';
import { InputType, Field, PartialType, PickType } from '@nestjs/graphql';
import { UserRole, UserStatus } from '@ace-pomelo/infrastructure-datasource';
import { NewUserInput } from './new-user.input';

@InputType({ description: 'Update user input' })
export class UpdateUserInput extends PartialType(
  PickType(NewUserInput, ['firstName', 'lastName', 'url', 'avator', 'description', 'adminColor'] as const),
) {
  @Field((type) => UserStatus, { nullable: true, description: 'User status' })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @Field({ nullable: true, description: 'Display name' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @Field({ nullable: true, description: 'Nick name' })
  @IsOptional()
  @IsString()
  nickName?: string;

  @Field((type) => UserRole, {
    nullable: true,
    description: 'Capabilities, set null to forbidden all capabilities',
  })
  @IsOptional()
  @ValidateIf((o) => o.capabilities !== null)
  @IsEnum(UserRole)
  capabilities?: UserRole | null;

  @Field({ nullable: true, description: 'Locale, set null to reset as using site default locale' })
  @IsOptional()
  @ValidateIf((o) => o.locale !== null)
  @IsLocale()
  locale?: string | null;
}
