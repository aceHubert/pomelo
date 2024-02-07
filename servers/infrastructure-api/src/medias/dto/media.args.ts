import { Field, ArgsType, Int } from '@nestjs/graphql';
import { PagedMediaArgsValidator } from './media-args.validator';

@ArgsType()
export class PagedMediaArgs extends PagedMediaArgsValidator {
  /**
   * Fuzzy search by field "original fileName"
   */
  keyword?: string;

  /**
   * File extensions
   */
  extensions?: string[];

  /**
   * Mime type
   */
  mimeTypes?: string[];

  /**
   * Page offset
   */
  @Field((type) => Int, { defaultValue: 0 })
  offset?: number;

  /**
   * Page size
   */
  @Field((type) => Int, { defaultValue: 20 })
  limit?: number;
}
