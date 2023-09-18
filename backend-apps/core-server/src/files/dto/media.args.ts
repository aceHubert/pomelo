import { Field, ArgsType, Int } from '@nestjs/graphql';
import { PagedMediaArgsValidator } from './media-args.validator';

@ArgsType()
export class PagedMediaArgs extends PagedMediaArgsValidator {
  @Field({ nullable: true, description: 'Fuzzy search by field "original fileName"' })
  keyword?: string;

  @Field({ nullable: true, description: 'File extensions' })
  extensions?: string[];

  @Field({ nullable: true, description: 'Mime type' })
  mimeTypes?: string[];

  @Field((type) => Int, { nullable: true, description: 'Page offset, Default: 0' })
  offset?: number;

  @Field((type) => Int, { nullable: true, description: 'Page size, Default: 20' })
  limit?: number;
}
