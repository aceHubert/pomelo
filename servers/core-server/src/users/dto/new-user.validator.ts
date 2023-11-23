import {
  IsOptional,
  IsDefined,
  IsNotEmpty,
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsEnum,
  MinLength,
  IsUrl,
} from 'class-validator';
import { NewUserInput, UserRole } from '@ace-pomelo/datasource';

export abstract class NewUserValidator implements NewUserInput {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  abstract loginName: string;

  @IsDefined()
  @IsString()
  @MinLength(6)
  abstract loginPwd: string;

  @IsOptional()
  @IsString()
  abstract firstName?: string | undefined;

  @IsOptional()
  @IsString()
  abstract lastName?: string | undefined;

  @IsOptional()
  @IsString()
  abstract avator?: string | undefined;

  @IsOptional()
  @IsString()
  abstract description?: string | undefined;

  @IsOptional()
  @IsString()
  abstract adminColor?: string | undefined;

  @IsOptional()
  @IsEnum(UserRole)
  abstract capabilities?: UserRole;

  @IsOptional()
  @IsString()
  abstract locale?: string | undefined;

  @IsDefined()
  @IsString()
  @IsEmail()
  abstract email: string;

  @IsDefined()
  @IsString()
  @IsPhoneNumber()
  abstract mobile: string;

  @IsDefined()
  @IsString()
  @IsUrl()
  abstract url: string;
}
