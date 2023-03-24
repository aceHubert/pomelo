import { Type } from 'class-transformer';
import { IsOptional, IsNotEmpty, IsInt } from 'class-validator';

// Types
import { TermTaxonomyArgs } from '@/sequelize-datasources/interfaces';

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
