import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, Min, Max } from 'class-validator';

export abstract class PagedCommentArgsValidator {
  @IsOptional()
  @IsNumber()
  abstract templateId?: number;

  @IsOptional()
  @IsNumber()
  abstract parentId?: number;

  @Type()
  @IsOptional()
  @Min(0)
  @IsInt()
  abstract offset?: number;

  @Type()
  @IsOptional()
  @Min(5)
  @Max(100)
  @IsInt()
  abstract limit?: number;
}
