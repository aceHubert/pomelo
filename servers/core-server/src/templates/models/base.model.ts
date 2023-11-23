import { Field, ObjectType, ID, OmitType, PickType } from '@nestjs/graphql';
import { TemplateStatus, TemplateCommentStatus } from '@ace-pomelo/datasource';
// import { FieldAuthorized, UserRole } from '@ace-pomelo/authorization';
import { Meta } from '@/common/resolvers/models/meta.model';
import { PagedResponse, Count } from '@/common/resolvers/models/paged.model';

@ObjectType({ description: 'Template model' })
export class Template {
  @Field((type) => ID, { description: 'Template Id' })
  id!: number;

  @Field({ description: 'Name (alias path)' })
  name!: string;

  @Field({ description: 'Title' })
  title!: string;

  @Field({ description: 'Short description' })
  excerpt!: string;

  @Field({ description: 'Content' })
  content!: string;

  // @FieldAuthorized(UserRole.Administrator)
  @Field((type) => ID, { description: 'Author id' })
  author!: number;

  // @FieldAuthorized(UserRole.Administrator)
  @Field((type) => TemplateStatus, { description: 'Status' })
  status!: TemplateStatus;

  @Field({ description: 'Type' })
  type!: string;

  @Field((type) => TemplateCommentStatus, { description: 'Comment status' })
  commentStatus!: TemplateCommentStatus;

  @Field({ description: 'Comment count' })
  commentCount!: number;

  @Field({ description: 'Latest update time' })
  updatedAt!: Date;

  @Field({ description: 'Creation time' })
  createdAt!: Date;
}

@ObjectType({ description: 'Template meta' })
export class TemplateMeta extends Meta {
  @Field((type) => ID, { description: 'Template Id' })
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
  @Field((type) => TemplateStatus, { description: 'Template status' })
  status!: TemplateStatus;
}

@ObjectType({ description: `Template count by day` })
export class TemplateDayCount extends Count {
  @Field({ description: 'Day (format: yyyyMMdd)' })
  day!: string;
}

@ObjectType({ description: `Template count by month` })
export class TemplateMonthCount extends Count {
  @Field({ description: 'Month (format: yyyyMM)' })
  month!: string;
}

@ObjectType({ description: `Template count by year` })
export class TemplateYearCount extends Count {
  @Field({ description: 'Year (format: yyyy)' })
  year!: string;
}
