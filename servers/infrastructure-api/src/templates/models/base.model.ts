import { Field, ObjectType, ID, Int, OmitType, PickType } from '@nestjs/graphql';
import { TemplateStatus, TemplateCommentStatus } from '@ace-pomelo/infrastructure-datasource';
// import { FieldAuthorized, UserRole } from '@ace-pomelo/authorization';
import { Meta } from '@/common/resolvers/models/meta.model';
import { PagedResponse, Count } from '@/common/resolvers/models/paged.model';

@ObjectType({ description: 'Template model' })
export class Template {
  /**
   * Template Id
   */
  @Field((type) => ID)
  id!: number;

  /**
   * Name (alias path)
   */
  name!: string;

  /**
   * Title
   */
  title!: string;

  /**
   * Short description
   */
  excerpt!: string;

  /**
   * Content
   */
  content!: string;

  // @FieldAuthorized(UserRole.Administrator)
  /**
   * Author id
   */
  @Field((type) => ID)
  author!: number;

  // @FieldAuthorized(UserRole.Administrator)
  /**
   * Status
   */
  @Field((type) => TemplateStatus)
  status!: TemplateStatus;

  /**
   * Type
   */
  type!: string;

  /**
   * Comment status
   */
  @Field((type) => TemplateCommentStatus)
  commentStatus!: TemplateCommentStatus;

  /**
   * Comment count
   */
  @Field((type) => Int)
  commentCount!: number;

  /**
   * Latest update time
   */
  updatedAt!: Date;

  /**
   * Creation time
   */
  createdAt!: Date;
}

@ObjectType({ description: 'Template meta' })
export class TemplateMeta extends Meta {
  /**
   * Template Id
   */
  @Field((type) => ID)
  templateId!: number;
}

@ObjectType({ description: 'Paged  template item model' })
export class PagedTemplateItem extends OmitType(Template, ['content'] as const) {}

@ObjectType({ description: 'Paged template model' })
export class PagedTemplate extends PagedResponse(PagedTemplateItem) {
  // other fields
}

@ObjectType({ description: 'Template option model' })
export class TemplateOption extends PickType(Template, ['id', 'title'] as const) {
  // other fields
}

@ObjectType({ description: 'Template count by status' })
export class TemplateStatusCount extends Count {
  /**
   * Template status
   */
  @Field((type) => TemplateStatus, {})
  status!: TemplateStatus;
}

@ObjectType({ description: `Template count by day` })
export class TemplateDayCount extends Count {
  /**
   * Day (format: yyyyMMdd)
   */
  day!: string;
}

@ObjectType({ description: `Template count by month` })
export class TemplateMonthCount extends Count {
  /**
   * Month (format: yyyyMM)
   */
  month!: string;
}

@ObjectType({ description: `Template count by year` })
export class TemplateYearCount extends Count {
  /**
   * Year (format: yyyy)
   */
  year!: string;
}
