import { Type } from 'class-transformer';
import { IsOptional, IsDefined, IsNotEmpty, IsInt } from 'class-validator';
import { NewTermTaxonomyInput } from '@/sequelize-datasources/interfaces';

export abstract class NewTermTaxonomyValidator implements NewTermTaxonomyInput {
  @IsNotEmpty()
  abstract name: string;

  @IsOptional()
  abstract slug?: string;

  @Type()
  @IsOptional()
  @IsInt()
  abstract objectId?: number;

  @IsNotEmpty()
  abstract taxonomy: string;

  @IsDefined()
  abstract description: string;

  @Type()
  @IsOptional()
  @IsInt()
  abstract parentId?: number;

  @Type()
  @IsOptional()
  @IsInt()
  abstract group?: number;
}
