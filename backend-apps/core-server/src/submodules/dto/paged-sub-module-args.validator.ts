import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, MaxLength } from 'class-validator';

export abstract class PagedSubModuleArgsValidator {
  @IsOptional()
  @MaxLength(100)
  name?: string;

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
