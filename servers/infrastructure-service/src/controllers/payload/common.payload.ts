import { Type } from 'class-transformer';
import { IsOptional, IsInt, IsPositive, Min, Max } from 'class-validator';

export abstract class PagedQueryPayload {
  /**
   * Offset
   * @default: 0
   */
  @Type()
  @IsOptional()
  @Min(0)
  @IsInt()
  offset?: number;
  /**
   * Page size
   * @defaule 20
   */
  @Type()
  @IsOptional()
  @Min(5)
  @Max(100)
  @IsInt()
  limit?: number;
}

export class RequestUserIdPayload {
  /**
   * Request user id
   */
  @IsPositive()
  requestUserId!: number;
}
