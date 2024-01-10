import { IsString, IsDefined, IsOptional, IsBoolean, MinLength } from 'class-validator';

export class LoginDto {
  /**
   * Username
   */
  @IsDefined()
  @IsString()
  username!: string;

  /**
   * Password
   * @minLength 6
   */
  @IsDefined()
  @IsString()
  @MinLength(6)
  password!: string;

  /**
   * Remember Me
   */
  @IsOptional()
  @IsBoolean()
  remember?: boolean;

  /**
   * Argee with user policy
   */
  @IsOptional()
  @IsBoolean()
  userPolicy?: boolean;
}
