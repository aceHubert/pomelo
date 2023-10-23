import { Type } from 'class-transformer';
import { IsOptional, IsInt, IsArray, Min, Max } from 'class-validator';

export abstract class PagedMediaArgsValidator {
  @IsOptional()
  abstract keyword?: string;

  @IsOptional()
  @IsArray()
  abstract extensions?: string[];

  @IsOptional()
  @IsArray()
  abstract mimeTypes?: string[];

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
