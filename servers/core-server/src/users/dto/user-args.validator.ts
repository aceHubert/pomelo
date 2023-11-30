import { Type } from 'class-transformer';
import { IsOptional, IsInt, IsEnum, Min, Max } from 'class-validator';
import { UserStatus } from '@ace-pomelo/infrastructure-datasource';

export abstract class PagedUserArgsValidator {
  @IsOptional()
  abstract keyword?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  abstract status?: UserStatus;

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
