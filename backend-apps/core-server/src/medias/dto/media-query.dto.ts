import { ApiProperty } from '@nestjs/swagger';
import { PagedMediaArgsValidator } from './media-args.validator';

export class PagedMediaQueryDto extends PagedMediaArgsValidator {
  /**
   * Fuzzy search by field "original fileName"
   */
  keyword?: string;

  /**
   * File extensions
   */
  extensions?: string[];

  /**
   * Mime types
   */
  mimeTypes?: string[];

  /**
   * Paged offset
   */
  @ApiProperty({ minimum: 0, default: 0 })
  offset?: number;

  /**
   * Paged limit
   */
  @ApiProperty({ minimum: 5, maximum: 100, default: 20 })
  limit?: number;
}
