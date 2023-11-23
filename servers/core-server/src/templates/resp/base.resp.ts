import { ApiResponseProperty, OmitType, PickType } from '@nestjs/swagger';
import { TemplateStatus, TemplateCommentStatus } from '@ace-pomelo/datasource';
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
  @ApiResponseProperty()
  status!: TemplateStatus;

  /**
   * Type
   */
  @ApiResponseProperty()
  type!: string;

  /**
   * Comment status
   */
  @ApiResponseProperty()
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
  status!: TemplateStatus;
}

export class TemplateDayCount extends Count {
  /**
   * Day (format: yyyyMMdd)
   */
  day!: string;
}

export class TemplateMonthCount extends Count {
  /**
   * Month (format: yyyyMM)
   */
  month!: string;
}

export class TemplateYearCount extends Count {
  /**
   * Year (format: yyyy)
   */
  year!: string;
}
