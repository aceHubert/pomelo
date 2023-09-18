import { ModuleRef } from '@nestjs/core';
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { Fields, User, RequestUser } from '@pomelo/shared';
import {
  TemplateDataSource,
  PagedTemplateArgs,
  TemplateOptionArgs,
  Taxonomy,
  TemplateStatus,
  TemplateType,
} from '@pomelo/datasource';
import { ResolveTree } from 'graphql-parse-resolve-info';
import { Anonymous, Authorized } from 'nestjs-authorization';
import { RamAuthorized } from 'nestjs-ram-authorization';
import { FormTemplateAction } from '@/common/actions';
import { createMetaFieldResolver } from '@/common/resolvers/meta.resolver';
import { MessageService } from '@/messages/message.service';
import { NewFormTemplateInput } from './dto/new-template.input';
import { UpdateFormTemplateInput } from './dto/update-template.input';
import { PagedFormTemplateArgs, FormTemplateOptionArgs } from './dto/template.args';
import { FormTemplate, PagedFormTemplate, FormTemplateOption } from './models/form.model';

@Authorized()
@Resolver(() => FormTemplate)
export class FormTemplateResolver extends createMetaFieldResolver(FormTemplate, TemplateDataSource) {
  constructor(
    protected readonly moduleRef: ModuleRef,
    private readonly templateDataSource: TemplateDataSource,
    private readonly messageService: MessageService,
  ) {
    super(moduleRef);
  }

  @Anonymous()
  @Query((returns) => [FormTemplateOption], { nullable: true, description: 'Get form template options.' })
  formTemplateOptions(
    @Args() args: FormTemplateOptionArgs,
    @Fields() fields: ResolveTree,
  ): Promise<FormTemplateOption[]> {
    const { categoryId, categoryName, ...restArgs } = args;
    return this.templateDataSource.getOptions(
      {
        ...restArgs,
        taxonomies: [
          (categoryId !== void 0 || categoryName !== void 0) && {
            taxonomyType: Taxonomy.Category,
            taxonomyId: categoryId,
            taxonomyName: categoryName,
          },
        ].filter(Boolean) as TemplateOptionArgs['taxonomies'],
      },
      TemplateType.Form,
      this.getFieldNames(fields.fieldsByTypeName.FormTemplateOption),
    );
  }

  @Anonymous()
  @Query((returns) => FormTemplate, { nullable: true, description: 'Get form template.' })
  async formTemplate(
    @Args('id', { type: () => ID, description: 'Form id' }) id: number,
    @Fields() fields: ResolveTree,
    @User() requestUser?: RequestUser,
  ): Promise<FormTemplate | undefined> {
    const result = await this.templateDataSource.get(
      id,
      TemplateType.Form,
      // content 不在模型里
      ['content', ...this.getFieldNames(fields.fieldsByTypeName.FormTemplate)],
      requestUser,
    );
    if (result) {
      const { content, ...restData } = result;
      return {
        ...restData,
        schema: content,
      };
    }
    return;
  }

  @RamAuthorized(FormTemplateAction.PagedList)
  @Query((returns) => PagedFormTemplate, { description: 'Get paged form templates.' })
  async formTemplates(
    @Args() args: PagedFormTemplateArgs,
    @Fields() fields: ResolveTree,
    @User() requestUser?: RequestUser,
  ): Promise<PagedFormTemplate> {
    const { categoryId, categoryName, ...restArgs } = args;
    const { rows, total } = await this.templateDataSource.getPaged(
      {
        ...restArgs,
        taxonomies: [
          (categoryId !== void 0 || categoryName !== void 0) && {
            taxonomyType: Taxonomy.Category,
            taxonomyId: categoryId,
            taxonomyName: categoryName,
          },
        ].filter(Boolean) as PagedTemplateArgs['taxonomies'],
      },
      TemplateType.Form,
      this.getFieldNames(fields.fieldsByTypeName.PagedFormTemplate.rows.fieldsByTypeName.PagedFormTemplateItem),
      requestUser,
    );

    return {
      rows,
      total,
    };
  }

  @RamAuthorized(FormTemplateAction.Create)
  @Mutation((returns) => FormTemplate, { description: 'Create a new form template.' })
  async createFormTemplate(
    @Args('model', { type: () => NewFormTemplateInput }) model: NewFormTemplateInput,
    @User() requestUser: RequestUser,
  ): Promise<FormTemplate> {
    const { schema, ...restInput } = model;
    const { id, title, author, content, status, updatedAt, createdAt } = await this.templateDataSource.create(
      { content: schema, ...restInput },
      TemplateType.Form,
      requestUser,
    );

    // 新建（当状态为需要审核）审核消息推送
    if (status === TemplateStatus.Pending) {
      await this.messageService.publish({
        excludes: [requestUser.sub!],
        message: {
          eventName: 'createFormReview',
          payload: {
            id,
          },
        },
      });
    }

    return {
      id,
      title,
      author,
      schema: content,
      status,
      updatedAt,
      createdAt,
    };
  }

  @RamAuthorized(FormTemplateAction.Update)
  @Mutation((returns) => Boolean, { description: 'Update form template (must not be in "trash" status).' })
  async updateFormTemplate(
    @Args('id', { type: () => ID, description: 'Form id' }) id: number,
    @Args('model', { type: () => UpdateFormTemplateInput }) model: UpdateFormTemplateInput,
    @User() requestUser: RequestUser,
  ): Promise<boolean> {
    const { schema, ...restInput } = model;
    const result = await this.templateDataSource.update(id, { content: schema, ...restInput }, requestUser);

    // 修改（当状态为需要审核并且有任何修改）审核消息推送
    if (result && model.status === TemplateStatus.Pending) {
      await this.messageService.publish({
        excludes: [requestUser.sub!],
        message: {
          eventName: 'updateFormReview',
          payload: {
            id,
          },
        },
      });
    }

    return result;
  }
}
