import { ApiResponseProperty, OmitType, PickType } from '@nestjs/swagger';
import { PagedResponse } from '@/common/controllers/resp/paged.resp';
import { TemplateModelResp, TemplateMetaModelResp } from './base.resp';

export class FormTemplateModelResp extends PickType(TemplateModelResp, [
  'id',
  'title',
  'content',
  'author',
  'status',
  'updatedAt',
  'createdAt',
] as const) {}

export class FormTemplateWithMetasModelResp extends FormTemplateModelResp {
  /**
   * Metas
   */
  @ApiResponseProperty()
  metas?: Array<TemplateMetaModelResp>;
}

export class PagedFormTemplateResp extends PagedResponse(OmitType(FormTemplateModelResp, ['content'] as const)) {}

export class FormTemplateOptionResp extends PickType(FormTemplateModelResp, ['id', 'title'] as const) {}
