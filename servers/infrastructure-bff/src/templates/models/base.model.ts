import { Field, ObjectType, ID, Int, OmitType, PickType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { DateTimeISOResolver } from 'graphql-scalars';
import { TemplateStatus, TemplateCommentStatus } from '@ace-pomelo/shared/server';
// import { FieldAuthorized, UserRole } from '@ace-pomelo/nestjs-authorization';
import { Meta } from '@/common/resolvers/models/meta.model';
import { PagedResponse, Count } from '@/common/resolvers/models/paged.model';

@ObjectType({ description: 'Template model' })
export class Template {
  /**
   * Template Id
   */
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
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
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
  author!: number;

  // @FieldAuthorized(UserRole.Administrator)
  /**
   * Status
   */
  @Field(() => TemplateStatus)
  status!: TemplateStatus;

  /**
   * Type
   */
  type!: string;

  /**
   * Comment status
   */
  @Field(() => TemplateCommentStatus)
  commentStatus!: TemplateCommentStatus;

  /**
   * Comment count
   */
  @Field(() => Int)
  commentCount!: number;

  /**
   * Latest update time
   */
  @Field(() => DateTimeISOResolver)
  updatedAt!: Date;

  /**
   * Creation time
   */
  @Field(() => DateTimeISOResolver)
  createdAt!: Date;
}

@ObjectType({ description: 'Template meta' })
export class TemplateMeta extends Meta {
  /**
   * Template Id
   */
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
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
  @Field(() => TemplateStatus, {})
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
