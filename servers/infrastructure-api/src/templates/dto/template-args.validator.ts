import { Type } from 'class-transformer';
import { IsOptional, IsInt, IsEnum, IsDefined, IsString, Min, Max } from 'class-validator';
import { TemplateStatus } from '@ace-pomelo/infrastructure-datasource';

export abstract class PagedTemplateArgsValidator {
  @IsOptional()
  abstract keyword?: string;

  @IsOptional()
  @IsString()
  abstract author?: string;

  @IsOptional()
  @IsEnum(TemplateStatus)
  abstract status?: TemplateStatus;

  @IsDefined()
  @IsString()
  abstract type: string;

  @IsOptional()
  @IsString()
  abstract date?: string;

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

export abstract class CagetoryArgsValidator {
  @Type()
  @IsOptional()
  @IsInt()
  abstract categoryId?: number;

  @IsOptional()
  abstract categoryName?: string;
}

export abstract class TagArgsValidator {
  @Type()
  @IsOptional()
  @IsInt()
  abstract tagId?: number;

  @IsOptional()
  abstract tagName?: string;
}
