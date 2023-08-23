import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsEnum } from 'class-validator';
import { TemplateStatus } from '@/orm-entities/interfaces/template.interface';

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
  @IsEnum(TemplateStatus)
  status!: TemplateStatus;
}
