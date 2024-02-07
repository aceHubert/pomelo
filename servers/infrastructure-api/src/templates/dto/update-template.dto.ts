import { IsArray, IsInt, IsEnum } from 'class-validator';
import { ApiProperty, ApiHideProperty, PartialType, PickType } from '@nestjs/swagger';
import { TemplateStatus } from '@ace-pomelo/infrastructure-datasource';
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
  @IsInt({ each: true })
  templateIds!: number[];

  /**
   * Status
   */
  @ApiHideProperty() // FIX: Hide from nest-cli plugin, enum compile to relative path from packages
  @ApiProperty({
    enum: TemplateStatus,
    required: false,
    description: 'Status',
  })
  @IsEnum(TemplateStatus)
  status!: TemplateStatus;
}
