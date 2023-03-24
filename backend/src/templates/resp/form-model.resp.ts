import { ApiResponseProperty, OmitType, PickType } from '@nestjs/swagger';
import { PagedResponse } from '@/common/controllers/resp/paged.resp';
import { TemplateModelResp, TemplateMetaModelResp } from './base.resp';

export class FormTemplateModelResp extends PickType(TemplateModelResp, [
  'id',
  'title',
  'author',
  'status',
  'createdAt',
] as const) {
  /**
   * Schema
   */
  @ApiResponseProperty()
  schema!: string;
}

export class FormTemplateWithMetasModelResp extends FormTemplateModelResp {
  /**
   * Metas
   */
  @ApiResponseProperty()
  metas?: Array<TemplateMetaModelResp>;
}

export class PagedFormTemplateResp extends PagedResponse(OmitType(FormTemplateModelResp, ['schema'] as const)) {
  // something else
}

export class FormTemplateOptionResp extends PickType(FormTemplateModelResp, ['id', 'title'] as const) {}
