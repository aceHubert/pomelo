import { ApiResponseProperty, OmitType, PickType } from '@nestjs/swagger';
import { PagedResponse } from '@/common/controllers/resp/paged.resp';
import { TemplateModelResp, TemplateMetaModelResp } from './base.resp';

export class PageTemplateModelResp extends PickType(TemplateModelResp, [
  'id',
  'name',
  'title',
  'author',
  'status',
  'commentStatus',
  'commentCount',
  'updatedAt',
  'createdAt',
] as const) {
  /**
   * Schema
   */
  @ApiResponseProperty()
  schema!: string;
}

export class PageTemplateWithMetasModelResp extends PageTemplateModelResp {
  /**
   * Metas
   */
  @ApiResponseProperty()
  metas?: Array<TemplateMetaModelResp>;
}

export class PagedPageTemplateResp extends PagedResponse(OmitType(PageTemplateModelResp, ['schema'] as const)) {
  // something else
}

export class PageTemplateOptionResp extends PickType(PageTemplateModelResp, ['id', 'name', 'title'] as const) {}
