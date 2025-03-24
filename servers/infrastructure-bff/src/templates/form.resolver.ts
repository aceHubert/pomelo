import { Inject, ParseIntPipe, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ResolveTree } from 'graphql-parse-resolve-info';
import { VoidResolver } from 'graphql-scalars';
import { Anonymous, Authorized } from '@ace-pomelo/nestjs-authorization';
import { RamAuthorized } from '@ace-pomelo/nestjs-ram-authorization';
import {
  Fields,
  User,
  RequestUser,
  TemplateStatus,
  TemplatePresetType,
  TermPresetTaxonomy,
  POMELO_SERVICE_PACKAGE_NAME,
} from '@ace-pomelo/shared/server';
import {
  TEMPLATE_SERVICE_NAME,
  TemplateServiceClient,
  TemplateModel,
  GetTemplateOptionsRequest,
  GetPagedTemplateRequest,
} from '@ace-pomelo/shared/server/proto-ts/template';
import { TemplateAction, FormTemplateAction } from '@/common/actions';
import { createMetaFieldResolver } from '@/common/resolvers/meta.resolver';
import { WrapperTemplateStatus } from '@/common/utils/wrapper-enum.util';
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
  constructor(@Inject(POMELO_SERVICE_PACKAGE_NAME) client: ClientGrpc) {
    super(client);
  }
}

@Authorized()
@Resolver(() => FormTemplate)
export class FormTemplateAuthorResolver extends createAuthorFieldResolver(FormTemplate) {
  constructor(@Inject(POMELO_SERVICE_PACKAGE_NAME) client: ClientGrpc) {
    super(client);
  }
}

// #endregion

@Authorized()
@Resolver(() => PagedFormTemplateItem)
export class PagedFormTemplateItemMetaFieldResolver
  extends createMetaFieldResolver('template', PagedFormTemplateItem, {
    authDecorator: () => RamAuthorized(TemplateAction.MetaList),
  })
  implements OnModuleInit
{
  private templateServiceClient!: TemplateServiceClient;

  constructor(@Inject(POMELO_SERVICE_PACKAGE_NAME) private readonly client: ClientGrpc) {
    super();
  }

  onModuleInit() {
    this.templateServiceClient = this.client.getService<TemplateServiceClient>(TEMPLATE_SERVICE_NAME);
  }

  get metaServiceClient() {
    return this.templateServiceClient;
  }
}

@Authorized()
@Resolver(() => FormTemplate)
export class FormTemplateResolver
  extends createMetaFieldResolver('template', FormTemplate, {
    authDecorator: () => RamAuthorized(TemplateAction.MetaList),
  })
  implements OnModuleInit
{
  private templateServiceClient!: TemplateServiceClient;

  constructor(
    @Inject(POMELO_SERVICE_PACKAGE_NAME) private readonly client: ClientGrpc,
    private readonly messageService: MessageService,
  ) {
    super();
  }

  onModuleInit() {
    this.templateServiceClient = this.client.getService<TemplateServiceClient>(TEMPLATE_SERVICE_NAME);
  }

  get metaServiceClient() {
    return this.templateServiceClient;
  }

  private mapToFormTemplate(model: TemplateModel): FormTemplate {
    return {
      ...model,
      status: WrapperTemplateStatus.asValueOrDefault(model.status, TemplateStatus.Publish),
    };
  }

  @Anonymous()
  @Query((returns) => [FormTemplateOption], { nullable: true, description: 'Get form template options.' })
  async formTemplateOptions(
    @Args() args: FormTemplateOptionArgs,
    @Fields() fields: ResolveTree,
  ): Promise<FormTemplateOption[]> {
    const { categoryId, categoryName, ...restArgs } = args;
    const { options } = await this.templateServiceClient
      .getOptions({
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
        ].filter(Boolean) as GetTemplateOptionsRequest['taxonomies'],
        type: TemplatePresetType.Form,
        fields: this.getFieldNames(fields.fieldsByTypeName.FormTemplateOption),
      })
      .lastValue();

    return options;
  }

  @Anonymous()
  @Query((returns) => FormTemplate, { nullable: true, description: 'Get form template.' })
  async formTemplate(
    @Args('id', { type: () => ID, description: 'Form id' }, ParseIntPipe) id: number,
    @Fields() fields: ResolveTree,
    @User() requestUser?: RequestUser,
  ): Promise<FormTemplate | undefined> {
    const { template } = await this.templateServiceClient
      .get({
        id,
        type: TemplatePresetType.Form,
        fields: this.getFieldNames(fields.fieldsByTypeName.FormTemplate),
        requestUserId: requestUser ? Number(requestUser.sub) : undefined,
      })
      .lastValue();

    return template ? this.mapToFormTemplate(template) : undefined;
  }

  @Query((returns) => PagedFormTemplate, { description: 'Get paged form templates.' })
  async formTemplates(
    @Args() args: PagedFormTemplateArgs,
    @Fields() fields: ResolveTree,
    @User() requestUser?: RequestUser,
  ): Promise<PagedFormTemplate> {
    const { categoryId, categoryName, ...restArgs } = args;
    return this.templateServiceClient
      .getPaged({
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
        ].filter(Boolean) as GetPagedTemplateRequest['taxonomies'],
        type: TemplatePresetType.Form,
        fields: this.getFieldNames(
          fields.fieldsByTypeName.PagedFormTemplate.rows.fieldsByTypeName.PagedFormTemplateItem,
        ),
        requestUserId: requestUser ? Number(requestUser.sub) : undefined,
      })
      .lastValue()
      .then(({ rows, ...rest }) => ({
        ...rest,
        rows: rows.map((row) => this.mapToFormTemplate(row)),
      }));
  }

  @RamAuthorized(FormTemplateAction.Create)
  @Mutation((returns) => FormTemplate, { description: 'Create a new form template.' })
  async createFormTemplate(
    @Args('model', { type: () => NewFormTemplateInput }) model: NewFormTemplateInput,
    @User() requestUser: RequestUser,
  ): Promise<FormTemplate> {
    const { template } = await this.templateServiceClient
      .createForm({
        ...model,
        metas: model.metas || [],
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();

    // 新建（当状态为需要审核）审核消息推送
    if (template.status === TemplateStatus.Pending) {
      await this.messageService.publish(
        {
          eventName: 'createFormReview',
          payload: {
            id: template.id,
          },
        },
        { excludes: [requestUser.sub] },
      );
    }

    return this.mapToFormTemplate(template);
  }

  @RamAuthorized(FormTemplateAction.Update)
  @Mutation((returns) => VoidResolver, {
    nullable: true,
    description: 'Update form template (must not be in "trash" status).',
  })
  async updateFormTemplate(
    @Args('id', { type: () => ID, description: 'Form id' }, ParseIntPipe) id: number,
    @Args('model', { type: () => UpdateFormTemplateInput }) model: UpdateFormTemplateInput,
    @User() requestUser: RequestUser,
  ): Promise<void> {
    await this.templateServiceClient
      .update({
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
