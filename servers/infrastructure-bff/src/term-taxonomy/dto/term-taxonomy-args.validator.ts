import { Type } from 'class-transformer';
import { IsOptional, IsNotEmpty, IsInt } from 'class-validator';

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
}
