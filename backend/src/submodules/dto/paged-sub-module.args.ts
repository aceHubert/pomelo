import { Field, ArgsType, Int, OmitType } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';
import { PagedSubModuleArgsValidator } from './paged-sub-module-args.validator';

@ArgsType()
export class PagedSubModuleArgs extends PagedSubModuleArgsValidator {
  @Field({ nullable: true, description: 'Sub-module name' })
  name?: string;

  @Field((type) => Int, { nullable: true, description: 'Paged offset', defaultValue: 0 })
  offset?: number;

  @Field((type) => Int, { nullable: true, description: 'Paged limit', defaultValue: 20 })
  limit?: number;
}

@ArgsType()
export class PagedObsSubModuleArgs extends OmitType(PagedSubModuleArgs, ['offset'] as const) {
  @IsOptional()
  @IsString()
  @Field({ nullable: true, description: 'Market' })
  marker?: string;
}
