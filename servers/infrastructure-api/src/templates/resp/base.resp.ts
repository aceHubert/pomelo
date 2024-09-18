import { ApiProperty, ApiResponseProperty, OmitType, PickType } from '@nestjs/swagger';
import { TemplateStatus, TemplateCommentStatus } from '@ace-pomelo/shared/server';
import { PagedResponse, Count } from '@/common/controllers/resp/paged.resp';
import { MetaModelResp } from '@/common/controllers/resp/meta-model.resp';

export class TemplateModelResp {
  /**
   * Template id
   */
  @ApiResponseProperty()
  id!: number;

  /**
   * Name (Route path alias)
   */
  @ApiResponseProperty()
  name!: string;

  /**
   * Title
   */
  @ApiResponseProperty()
  title!: string;

  /**
   * Author id
   */
  @ApiResponseProperty()
  author!: string;

  /**
   * Short description
   */
  @ApiResponseProperty()
  excerpt!: string;

  /**
   * Content
   */
  @ApiResponseProperty()
  content!: string;

  /**
   * Status
   */
  @ApiProperty({
    enum: TemplateStatus,
    readOnly: true,
    description: 'Status',
  })
  // @ApiResponseProperty()
  status!: TemplateStatus;

  /**
   * Type
   */
  @ApiResponseProperty()
  type!: string;

  /**
   * Comment status
   */
  @ApiProperty({
    enum: TemplateCommentStatus,
    readOnly: true,
    description: 'Comment status',
  })
  // @ApiResponseProperty()
  commentStatus!: TemplateCommentStatus;

  /**
   * Comment count
   */
  @ApiResponseProperty()
  commentCount!: number;

  /**
   * Latest update time
   */
  @ApiResponseProperty()
  updatedAt!: Date;

  /**
   * Created time
   */
  @ApiResponseProperty()
  createdAt!: Date;
}

export class TemplateWithMetasModelResp extends TemplateModelResp {
  /**
   * Metas
   */
  @ApiResponseProperty()
  metas?: Array<TemplateMetaModelResp>;
}

export class PagedTemplateResp extends PagedResponse(OmitType(TemplateModelResp, ['content'] as const)) {}

export class TemplateOptionResp extends PickType(TemplateModelResp, ['id', 'title'] as const) {}

export class TemplateMetaModelResp extends MetaModelResp {
  /**
   * Template id
   */
  @ApiResponseProperty()
  templateId!: number;
}

export class TemplateStatusCount extends Count {
  /**
   * Template status
   */
  @ApiProperty({
    enum: TemplateStatus,
    readOnly: true,
    description: 'Template status',
  })
  // @ApiResponseProperty()
  status!: TemplateStatus;
}

export class TemplateDayCount extends Count {
  /**
   * Day (format: yyyyMMdd)
   */
  @ApiResponseProperty()
  day!: string;
}

export class TemplateMonthCount extends Count {
  /**
   * Month (format: yyyyMM)
   */
  @ApiResponseProperty()
  month!: string;
}

export class TemplateYearCount extends Count {
  /**
   * Year (format: yyyy)
   */
  @ApiResponseProperty()
  year!: string;
}
