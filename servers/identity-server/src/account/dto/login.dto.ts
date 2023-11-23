import { IsString, IsDefined, IsBoolean, MinLength } from 'class-validator';

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
   * Remember
   */
  @IsBoolean()
  remember?: boolean;
}
