import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PagedSubModuleArgsValidator } from './paged-sub-module-args.validator';

export class PagedSubModuleQueryDto extends PagedSubModuleArgsValidator {
  /**
   * Sub-module name
   */
  name?: string;

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

export class PagedObsSubModuleQueryDto extends OmitType(PagedSubModuleQueryDto, ['offset'] as const) {
  @IsOptional()
  @IsString()
  marker?: string;
}
