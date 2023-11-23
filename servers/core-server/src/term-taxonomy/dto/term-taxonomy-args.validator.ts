import { Type } from 'class-transformer';
import { IsOptional, IsNotEmpty, IsInt } from 'class-validator';
import { TermTaxonomyArgs } from '@ace-pomelo/datasource';

export abstract class TermTaxonomyArgsValidator implements TermTaxonomyArgs {
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
