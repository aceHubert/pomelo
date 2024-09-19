import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ResolveTree } from 'graphql-parse-resolve-info';
import { VoidResolver } from 'graphql-scalars';
import { Anonymous, Authorized } from '@ace-pomelo/authorization';
import { RamAuthorized } from '@ace-pomelo/ram-authorization';
import {
  Fields,
  User,
  RequestUser,
  TemplateStatus,
  TemplatePresetType,
  TermPresetTaxonomy,
  INFRASTRUCTURE_SERVICE,
  TemplatePattern,
} from '@ace-pomelo/shared/server';
import { TemplateAction, FormTemplateAction } from '@/common/actions';
import { createMetaFieldResolver } from '@/common/resolvers/meta.resolver';
import { MessageService } from '@/messages/message.service';
import { createAuthorFieldResolver } from './base.resolver';
import { NewFormTemplateInput } from './dto/new-template.input';
import { UpdateFormTemplateInput } from './dto/update-template.input';
import { PagedFormTemplateArgs, FormTemplateOptionArgs } from './dto/template.args';
import { FormTemplate, PagedFormTemplate, FormTemplateOption, PagedFormTemplateItem } from './models/form.model';

// #region Author Resolver

@Authorized()
@Resolver(() => PagedFormTemplateItem)
export class PagedFormTemplateItemAuthorResolver extends createAuthorFieldResolver(PagedFormTemplateItem, true) {
  constructor(@Inject(INFRASTRUCTURE_SERVICE) protected readonly basicService: ClientProxy) {
    super(basicService);
  }
}

@Authorized()
@Resolver(() => FormTemplate)
export class FormTemplateAuthorResolver extends createAuthorFieldResolver(FormTemplate) {
  constructor(@Inject(INFRASTRUCTURE_SERVICE) protected readonly basicService: ClientProxy) {
    super(basicService);
  }
}

// #endregion

@Authorized()
@Resolver(() => PagedFormTemplateItem)
export class PagedFormTemplateItemMetaFieldResolver extends createMetaFieldResolver(PagedFormTemplateItem, {
  modelName: 'template',
  authDecorator: () => RamAuthorized(TemplateAction.MetaList),
}) {
  constructor(@Inject(INFRASTRUCTURE_SERVICE) protected readonly basicService: ClientProxy) {
    super(basicService);
  }
}

@Authorized()
@Resolver(() => FormTemplate)
export class FormTemplateResolver extends createMetaFieldResolver(FormTemplate, {
  modelName: 'template',
  authDecorator: () => RamAuthorized(TemplateAction.MetaList),
}) {
  constructor(
    @Inject(INFRASTRUCTURE_SERVICE) private basicService: ClientProxy,
    private readonly messageService: MessageService,
  ) {
    super(basicService);
  }

  @Anonymous()
  @Query((returns) => [FormTemplateOption], { nullable: true, description: 'Get form template options.' })
  formTemplateOptions(
    @Args() args: FormTemplateOptionArgs,
    @Fields() fields: ResolveTree,
  ): Promise<FormTemplateOption[]> {
    const { categoryId, categoryName, ...restArgs } = args;
    return this.basicService
      .send<FormTemplateOption[]>(TemplatePattern.GetOptions, {
        query: {
          ...restArgs,
          taxonomies: [
            categoryId !== void 0
              ? {
                  type: TermPresetTaxonomy.Category,
                  id: categoryId,
                }
              : categoryName !== void 0
              ? {
                  type: TermPresetTaxonomy.Category,
                  name: categoryName,
                }
              : false,
          ].filter(Boolean),
        },
        type: TemplatePresetType.Form,
        fields: this.getFieldNames(fields.fieldsByTypeName.FormTemplateOption),
      })
      .lastValue();
  }

  @Anonymous()
  @Query((returns) => FormTemplate, { nullable: true, description: 'Get form template.' })
  formTemplate(
    @Args('id', { type: () => ID, description: 'Form id' }) id: number,
    @Fields() fields: ResolveTree,
    @User() requestUser?: RequestUser,
  ) {
    return this.basicService
      .send<FormTemplate | undefined>(TemplatePattern.Get, {
        id,
        type: TemplatePresetType.Form,
        // content 不在模型里
        fields: ['content', ...this.getFieldNames(fields.fieldsByTypeName.FormTemplate)],
        requestUserId: requestUser ? Number(requestUser.sub) : undefined,
      })
      .lastValue();
  }

  @Query((returns) => PagedFormTemplate, { description: 'Get paged form templates.' })
  async formTemplates(
    @Args() args: PagedFormTemplateArgs,
    @Fields() fields: ResolveTree,
    @User() requestUser?: RequestUser,
  ): Promise<PagedFormTemplate> {
    const { categoryId, categoryName, ...restArgs } = args;
    return this.basicService
      .send<PagedFormTemplate>(TemplatePattern.GetPaged, {
        query: {
          ...restArgs,
          taxonomies: [
            categoryId !== void 0
              ? {
                  type: TermPresetTaxonomy.Category,
                  id: categoryId,
                }
              : categoryName !== void 0
              ? {
                  type: TermPresetTaxonomy.Category,
                  name: categoryName,
                }
              : false,
          ].filter(Boolean),
        },
        type: TemplatePresetType.Form,
        fields: this.getFieldNames(
          fields.fieldsByTypeName.PagedFormTemplate.rows.fieldsByTypeName.PagedFormTemplateItem,
        ),
        requestUserId: requestUser ? Number(requestUser.sub) : undefined,
      })
      .lastValue();
  }

  @RamAuthorized(FormTemplateAction.Create)
  @Mutation((returns) => FormTemplate, { description: 'Create a new form template.' })
  async createFormTemplate(
    @Args('model', { type: () => NewFormTemplateInput }) model: NewFormTemplateInput,
    @User() requestUser: RequestUser,
  ): Promise<FormTemplate> {
    const { id, title, author, content, status, updatedAt, createdAt } = await this.basicService
      .send<FormTemplate>(TemplatePattern.CreateForm, {
        ...model,
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();

    // 新建（当状态为需要审核）审核消息推送
    if (status === TemplateStatus.Pending) {
      await this.messageService.publish(
        {
          eventName: 'createFormReview',
          payload: {
            id,
          },
        },
        { excludes: [requestUser.sub] },
      );
    }

    return {
      id,
      title,
      author,
      content,
      status,
      updatedAt,
      createdAt,
    };
  }

  @RamAuthorized(FormTemplateAction.Update)
  @Mutation((returns) => VoidResolver, {
    nullable: true,
    description: 'Update form template (must not be in "trash" status).',
  })
  async updateFormTemplate(
    @Args('id', { type: () => ID, description: 'Form id' }) id: number,
    @Args('model', { type: () => UpdateFormTemplateInput }) model: UpdateFormTemplateInput,
    @User() requestUser: RequestUser,
  ): Promise<void> {
    await this.basicService
      .send<void>(TemplatePattern.Update, {
        ...model,
        id,
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();

    // 修改（当状态为需要审核并且有任何修改）审核消息推送
    if (model.status === TemplateStatus.Pending) {
      await this.messageService.publish(
        {
          eventName: 'updateFormReview',
          payload: {
            id,
          },
        },
        { excludes: [requestUser.sub] },
      );
    }

    await this.messageService.publish(
      {
        eventName: 'updateFormReview',
        payload: {
          id,
        },
      },
      { includes: [requestUser.sub] },
    );
  }
}
