import { IsDefined, IsNotEmpty, IsString, MinLength } from 'class-validator';

export abstract class SignInValidator {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  abstract username: string;

  @IsDefined()
  @IsString()
  @MinLength(6)
  abstract password: string;
}
