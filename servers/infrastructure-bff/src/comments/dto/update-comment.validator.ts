import { IsBoolean, IsOptional, IsString } from 'class-validator';

export abstract class UpdateCommentValidator {
  @IsOptional()
  @IsString()
  abstract content?: string;

  @IsOptional()
  @IsBoolean()
  abstract approved?: boolean;

  @IsOptional()
  @IsBoolean()
  abstract edited?: boolean;
}
