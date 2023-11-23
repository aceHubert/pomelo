import { IsOptional, IsDefined, IsString, IsEnum, MaxLength } from 'class-validator';
import { TemplateStatus, TemplateCommentStatus } from '@ace-pomelo/datasource';

export abstract class NewTemplateValidator {
  @IsOptional()
  @MaxLength(50)
  abstract title?: string;

  @IsOptional()
  @MaxLength(50)
  abstract name?: string;

  @IsOptional()
  @MaxLength(250)
  abstract excerpt?: string;

  @IsOptional()
  @IsString()
  abstract content?: string;

  @IsOptional()
  @IsEnum(TemplateStatus)
  abstract status?: TemplateStatus;

  @IsDefined()
  @IsString()
  abstract type: string;

  @IsOptional()
  @IsEnum(TemplateCommentStatus)
  abstract commentStatus?: TemplateCommentStatus;
}
