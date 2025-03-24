import { Type } from 'class-transformer';
import { IsOptional, IsNotEmpty, IsInt, IsArray } from 'class-validator';

export abstract class TermTaxonomyArgsValidator {
  @IsOptional()
  abstract keyword?: string;

  @IsNotEmpty()
  abstract taxonomy: string;

  @Type()
  @IsOptional()
  @IsInt()
  abstract parentId?: number;

  @Type()
  @IsOptional()
  @IsInt()
  abstract group?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  abstract exclude?: number[];
}
