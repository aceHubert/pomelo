import { Response } from 'express';
import { ApiTags, ApiQuery, ApiOkResponse, ApiNoContentResponse, ApiCreatedResponse } from '@nestjs/swagger';
import {
  Inject,
  Controller,
  Scope,
  Query,
  Param,
  Body,
  Get,
  Post,
  Put,
  ParseIntPipe,
  ParseArrayPipe,
  Res,
  HttpStatus,
  OnModuleInit,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Authorized, Anonymous } from '@ace-pomelo/nestjs-authorization';
import { RamAuthorized } from '@ace-pomelo/nestjs-ram-authorization';
import {
  createResponseSuccessType,
  ApiAuthCreate,
  ParseQueryPipe,
  ValidatePayloadExistsPipe,
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
  GetTemplateOptionsRequest,
  GetPagedTemplateRequest,
} from '@ace-pomelo/shared/server/proto-ts/template';
import { FormTemplateAction } from '@/common/actions';
import { BaseController } from '@/common/controllers/base.controller';
import { PagedFormTemplateQueryDto, FormTemplateOptionQueryDto } from './dto/template-query.dto';
import { NewFormTemplateDto } from './dto/new-template.dto';
import {
  FormTemplateModelResp,
  FormTemplateWithMetasModelResp,
  PagedFormTemplateResp,
  FormTemplateOptionResp,
} from './resp/form-model.resp';
import { UpdateFormTemplateDto } from './dto/update-template.dto';

/**
 * 表单 Restful Api 控制器
 */
@ApiTags('templates/form')
@Authorized()
@Controller({ path: 'api/template/forms', scope: Scope.REQUEST })
export class FormTemplateController extends BaseController implements OnModuleInit {
  private templateServiceClient!: TemplateServiceClient;

  constructor(@Inject(POMELO_SERVICE_PACKAGE_NAME) private readonly client: ClientGrpc) {
    super();
  }

  onModuleInit() {
    this.templateServiceClient = this.client.getService<TemplateServiceClient>(TEMPLATE_SERVICE_NAME);
  }

  /**
   *  Get form template options
   */
  @Get('options')
  @Anonymous()
  @ApiOkResponse({
    description: 'From template options',
    type: () => createResponseSuccessType({ data: [FormTemplateOptionResp] }, 'FormTemplateOptionModelsSuccessResp'),
  })
  async getOptions(@Query(ParseQueryPipe) query: FormTemplateOptionQueryDto) {
    const { categoryId, categoryName, ...restQuery } = query;
    const { options } = await this.templateServiceClient
      .getOptions({
        ...restQuery,
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
        fields: ['id', 'name', 'title'],
      })
      .lastValue();

    return this.success({
      data: options,
    });
  }

  /**
   * Get form template model by id
   */
  @Get(':id')
  @Anonymous()
  @ApiQuery({
    name: 'metaKeys',
    type: [String],
    required: false,
    example: ['mobile', 'desktop'],
    description: `return specific keys' metas if setted, otherwish all "metas" field return in "data".`,
  })
  @ApiOkResponse({
    description: 'From template model',
    type: () => createResponseSuccessType({ data: FormTemplateWithMetasModelResp }, 'FormTemplateModelSuccessResp'),
  })
  @ApiNoContentResponse({ description: 'Form template not found' })
  async get(
    @Param('id', ParseIntPipe) id: number,
    @Query('metaKeys', new ParseArrayPipe({ optional: true })) metaKeys: string[] | undefined,
    @Res({ passthrough: true }) res: Response,
    @User() requestUser?: RequestUser,
  ) {
    const { template } = await this.templateServiceClient
      .get({
        id,
        type: TemplatePresetType.Form,
        fields: ['id', 'title', 'author', 'content', 'status', 'updatedAt', 'createdAt'],
        requestUserId: requestUser ? Number(requestUser.sub) : undefined,
      })
      .lastValue();

    let metas;
    if (template && metaKeys?.length) {
      ({ metas } = await this.templateServiceClient
        .getMetas({
          templateId: template.id,
          metaKeys,
          fields: ['id', 'metaKey', 'metaValue'],
        })
        .lastValue());
    }

    if (!template) {
      res.status(HttpStatus.NO_CONTENT);
    }

    return this.success({
      data: {
        ...template,
        metas,
      },
    });
  }

  /**
   * Get paged form templates
   */
  @Get()
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Paged from template models',
    type: () => createResponseSuccessType({ data: PagedFormTemplateResp }, 'PagedFormTemplateSuccessResp'),
  })
  async getPaged(@Query(ParseQueryPipe) query: PagedFormTemplateQueryDto, @User() requestUser: RequestUser) {
    const { categoryId, categoryName, ...restQuery } = query;
    const templates = await this.templateServiceClient
      .getPaged({
        ...restQuery,
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
        fields: ['id', 'title', 'author', 'status', 'updatedAt', 'createdAt'],
        requestUserId: requestUser ? Number(requestUser.sub) : undefined,
      })
      .lastValue();

    return this.success({
      data: templates,
    });
  }

  /**
   * Create form template
   */
  @Post()
  @RamAuthorized(FormTemplateAction.Create)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiCreatedResponse({
    description: 'From template model',
    type: () => createResponseSuccessType({ data: FormTemplateModelResp }, 'FormTemplateModelSuccessResp'),
  })
  async create(@Body() input: NewFormTemplateDto, @User() requestUser: RequestUser) {
    const {
      template: { id, title, author, content, status, updatedAt, createdAt },
    } = await this.templateServiceClient
      .createForm({
        ...input,
        metas: [],
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();

    if (status === TemplateStatus.Pending) {
      // TODO: send WS message to admin to review
    }

    return this.success({
      data: {
        id,
        title,
        author,
        content,
        status,
        updatedAt,
        createdAt,
      },
    });
  }

  /**
   * Update form template
   */
  @Put(':id')
  @RamAuthorized(FormTemplateAction.Update)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}, 'UpdateFormTemplateSuccessResp'),
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidatePayloadExistsPipe) input: UpdateFormTemplateDto,
    @User() requestUser: RequestUser,
  ) {
    try {
      await this.templateServiceClient
        .update({
          ...input,
          id,
          requestUserId: Number(requestUser.sub),
        })
        .lastValue();

      if (input.status === TemplateStatus.Pending) {
        // TODO: send WS message to admin to review
      }

      return this.success();
    } catch (e: any) {
      this.logger.error(e);
      return this.faild(e.message);
    }
  }
}
