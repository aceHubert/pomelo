import { IsString, IsDefined, IsOptional, MinLength } from 'class-validator';

export class PasswordModifyDto {
  /**
   * Username
   */
  @IsDefined()
  @IsString()
  username!: string;

  /**
   * Old password
   * @minLength 6
   */
  @IsDefined()
  @IsString()
  @MinLength(6)
  oldPassword!: string;

  /**
   * New password
   * @minLength 6
   */
  @IsDefined()
  @IsString()
  @MinLength(6)
  newPassword!: string;

  /**
   * Current account id
   */
  @IsOptional()
  @IsString()
  accountId?: string;
}

export class PasswordForgotDto {
  /**
   * Username
   */
  @IsDefined()
  @IsString()
  username!: string;
}

export class PasswordResetDto {
  /**
   * Account id
   */
  @IsDefined()
  @IsString()
  accountId!: string;

  /**
   * New password
   */
  @IsDefined()
  @IsString()
  password!: string;
}
