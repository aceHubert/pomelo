import { IsArray, IsInt, IsEnum, ArrayNotEmpty } from 'class-validator';
import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { TemplateStatus } from '@ace-pomelo/shared/server';
import { NewTemplateDto, NewFormTemplateDto, NewPageTemplateDto, NewPostTemplateDto } from './new-template.dto';

export class UpdateTemplateDto extends PartialType(
  PickType(NewTemplateDto, ['name', 'title', 'excerpt', 'content', 'status'] as const),
) {}

export class UpdateFormTemplateDto extends PartialType(NewFormTemplateDto) {}

export class UpdatePageTemplateDto extends PartialType(NewPageTemplateDto) {}

export class UpdatePostTemplateDto extends PartialType(NewPostTemplateDto) {}

export class BulkUpdateTemplateStatusDto {
  /**
   * Template ids
   */
  @ApiProperty({ type: () => [Number] })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  ids!: number[];

  /**
   * Status
   */
  @ApiProperty({
    enum: TemplateStatus,
    required: false,
    description: 'Status',
  })
  @IsEnum(TemplateStatus)
  status!: TemplateStatus;
}
