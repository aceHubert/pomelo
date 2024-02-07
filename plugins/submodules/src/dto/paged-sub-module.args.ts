import { Field, ArgsType, Int, OmitType } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';
import { PagedSubModuleArgsValidator } from './paged-sub-module-args.validator';

@ArgsType()
export class PagedSubModuleArgs extends PagedSubModuleArgsValidator {
  /**
   * Sub-module name
   */
  name?: string;

  /**
   * Paged offset
   */
  @Field((type) => Int, { defaultValue: 0 })
  offset?: number;

  /**
   * Paged limit
   */
  @Field((type) => Int, { defaultValue: 20 })
  limit?: number;
}

@ArgsType()
export class PagedObsSubModuleArgs extends OmitType(PagedSubModuleArgs, ['offset'] as const) {
  @IsOptional()
  @IsString()
  /**
   * Marker
   */
  marker?: string;
}
