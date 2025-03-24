import { IsString, IsOptional, IsNumber, Length, MinLength, IsDefined, IsEnum } from 'class-validator';
import { CommentType } from '@ace-pomelo/shared/server';

export abstract class NewCommentValidator {
  @IsDefined()
  @IsNumber()
  abstract templateId: number;

  @IsDefined()
  @IsString()
  @MinLength(1)
  @Length(1, 1000)
  abstract content: string;

  @IsDefined()
  @IsString()
  @IsEnum(CommentType)
  abstract type: CommentType;

  @IsOptional()
  @IsNumber()
  abstract parentId?: number;
}
