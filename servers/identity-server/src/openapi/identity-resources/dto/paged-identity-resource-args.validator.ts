import { Type } from 'class-transformer';
import { IsOptional, IsInt, IsIn, Min, Max } from 'class-validator';

export abstract class PagedIdentityResourceArgsValidator {
  @IsOptional()
  abstract keyword?: string;

  @IsOptional()
  @IsIn(['name', 'displayName'])
  keywordField?: string;

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
