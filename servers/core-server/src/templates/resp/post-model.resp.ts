import { ApiResponseProperty, OmitType, PickType } from '@nestjs/swagger';
import { PagedResponse } from '@/common/controllers/resp/paged.resp';
import { TemplateModelResp, TemplateMetaModelResp } from './base.resp';

export class PostTemplateModelResp extends PickType(TemplateModelResp, [
  'id',
  'name',
  'title',
  'author',
  'content',
  'excerpt',
  'status',
  'commentStatus',
  'commentCount',
  'updatedAt',
  'createdAt',
] as const) {
  // something else
}

export class PostTemplateWithMetasModelResp extends PostTemplateModelResp {
  /**
   * Metas
   */
  @ApiResponseProperty()
  metas?: Array<TemplateMetaModelResp>;
}

export class PagedPostTemplateResp extends PagedResponse(OmitType(PostTemplateModelResp, ['content'] as const)) {
  // something else
}

export class PostTemplateOptionResp extends PickType(PostTemplateModelResp, ['id', 'name', 'title'] as const) {}
