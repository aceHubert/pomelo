import { Type } from 'class-transformer';
import { IsOptional, IsString, IsInt, IsArray, Min, Max, ArrayNotEmpty } from 'class-validator';

export abstract class PagedMediaArgsValidator {
  @IsOptional()
  abstract keyword?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  abstract extensions?: string[];

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
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
