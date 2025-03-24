import { Response } from 'express';
import { ApiTags, ApiQuery, ApiOkResponse, ApiCreatedResponse, ApiNoContentResponse } from '@nestjs/swagger';
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
  ParseQueryPipe,
  ValidatePayloadExistsPipe,
  ApiAuthCreate,
  User,
  RequestUser,
  OptionPresetKeys,
  TemplateStatus,
  TemplatePresetType,
  TermPresetTaxonomy,
  POMELO_SERVICE_PACKAGE_NAME,
} from '@ace-pomelo/shared/server';
import {
  GetPagedTemplateRequest,
  GetTemplateOptionsRequest,
  TEMPLATE_SERVICE_NAME,
  TemplateServiceClient,
} from '@ace-pomelo/shared/server/proto-ts/template';
import { OPTION_SERVICE_NAME, OptionServiceClient } from '@ace-pomelo/shared/server/proto-ts/option';
import { PageTemplateAction } from '@/common/actions';
import { BaseController } from '@/common/controllers/base.controller';
import { PageTemplateOptionQueryDto, PagedPageTemplateQueryDto } from './dto/template-query.dto';
import { NewPageTemplateDto } from './dto/new-template.dto';
import { UpdatePageTemplateDto } from './dto/update-template.dto';
import {
  PageTemplateModelResp,
  PageTemplateWithMetasModelResp,
  PagedPageTemplateResp,
  PageTemplateOptionResp,
} from './resp/page-model.resp';

/**
 * 表单 Restful Api 控制器
 */
@ApiTags('templates/page')
@Authorized()
@Controller({ path: 'api/template/pages', scope: Scope.REQUEST })
export class PageTemplateController extends BaseController implements OnModuleInit {
  private templateServiceClient!: TemplateServiceClient;
  private optionServiceClient!: OptionServiceClient;

  constructor(@Inject(POMELO_SERVICE_PACKAGE_NAME) private readonly client: ClientGrpc) {
    super();
  }

  onModuleInit() {
    this.templateServiceClient = this.client.getService<TemplateServiceClient>(TEMPLATE_SERVICE_NAME);
    this.optionServiceClient = this.client.getService<OptionServiceClient>(OPTION_SERVICE_NAME);
  }

  /**
   *  Get page template options
   */
  @Get('options')
  @Anonymous()
  @ApiOkResponse({
    description: 'Page template options',
    type: () => createResponseSuccessType({ data: [PageTemplateOptionResp] }, 'PageTemplateOptionModelsSuccessResp'),
  })
  async getOptions(@Query(ParseQueryPipe) query: PageTemplateOptionQueryDto) {
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
        type: TemplatePresetType.Page,
        fields: ['id', 'name', 'title'],
      })
      .lastValue();

    return this.success({
      data: options,
    });
  }

  /**
   * Get page alias paths
   */
  @Get('alias/paths')
  @Anonymous()
  @ApiOkResponse({
    description: 'Page path alias array',
    type: () => createResponseSuccessType({ data: [String] }, 'PageAliaPathsSuccessResp'),
  })
  async getPathAlias() {
    const { names } = await this.templateServiceClient.getNames({ type: TemplatePresetType.Page }).lastValue();

    return this.success({
      data: names,
    });
  }

  /**
   * Get page template model by alias name
   */
  @Get('alias')
  @Anonymous()
  @ApiQuery({
    name: 'name',
    type: String,
    required: false,
    example: '/page1',
    description: `page alias name, if not setted, will get the page template which is setted as "page on front".`,
  })
  @ApiQuery({
    name: 'metaKeys',
    type: [String],
    required: false,
    example: ['mobile', 'desktop'],
    description: `return specific keys' metas if setted, otherwish all "metas" field return in "data".`,
  })
  @ApiOkResponse({
    description: 'Page template model',
    type: () => createResponseSuccessType({ data: PageTemplateModelResp }, 'PageTemplateModelSuccessResp'),
  })
  @ApiNoContentResponse({ description: 'Page template not found' })
  async getByName(
    @Query('name') name: string | undefined,
    @Query('metaKeys', new ParseArrayPipe({ optional: true })) metaKeys: string[] | undefined,
    @Res({ passthrough: true }) res: Response,
    @User() requestUser?: RequestUser,
  ) {
    const { template } = name
      ? await this.templateServiceClient
          .getByName({
            name,
            type: TemplatePresetType.Page,
            fields: [
              'id',
              'name',
              'title',
              'author',
              'content',
              'status',
              'commentStatus',
              'commentCount',
              'updatedAt',
              'createdAt',
            ],
            requestUserId: requestUser ? Number(requestUser.sub) : undefined,
          })
          .lastValue()
      : await this.optionServiceClient
          .getValue({
            optionName: OptionPresetKeys.PageOnFront,
          })
          .lastValue()
          .then(({ optionValue: id }) => {
            if (id) {
              return this.templateServiceClient
                .get({
                  id: Number(id),
                  type: TemplatePresetType.Page,
                  fields: [
                    'id',
                    'name',
                    'title',
                    'author',
                    'content',
                    'status',
                    'commentStatus',
                    'commentCount',
                    'updatedAt',
                    'createdAt',
                  ],
                  requestUserId: requestUser ? Number(requestUser.sub) : undefined,
                })
                .lastValue();
            }
            return { template: undefined };
          });

    let metas;
    if (template && metaKeys?.length) {
      metas = await this.templateServiceClient
        .getMetas({
          templateId: template.id,
          metaKeys,
          fields: ['id', 'metaKey', 'metaValue'],
        })
        .lastValue();
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
   * Get page template model by id
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
    description: 'Page template model',
    type: () => createResponseSuccessType({ data: PageTemplateWithMetasModelResp }, 'PageTemplateModelSuccessResp'),
  })
  @ApiNoContentResponse({ description: 'Page template not found' })
  async get(
    @Param('id', ParseIntPipe) id: number,
    @Query('metaKeys', new ParseArrayPipe({ optional: true })) metaKeys: string[] | undefined,
    @Res({ passthrough: true }) res: Response,
    @User() requestUser?: RequestUser,
  ) {
    const { template } = await this.templateServiceClient
      .get({
        id,
        type: TemplatePresetType.Page,
        fields: [
          'id',
          'name',
          'title',
          'author',
          'content',
          'status',
          'commentStatus',
          'commentCount',
          'updatedAt',
          'createdAt',
        ],
        requestUserId: requestUser ? Number(requestUser.sub) : undefined,
      })
      .lastValue();

    let metas;
    if (template && metaKeys?.length) {
      ({ metas } = await this.templateServiceClient
        .getMetas({
          templateId: template.id,
          metaKeys: metaKeys || [],
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
   * Get paged page templates
   */
  @Get()
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Paged pages template models',
    type: () => createResponseSuccessType({ data: PagedPageTemplateResp }, 'PagedPageTemplateSuccessResp'),
  })
  async getPaged(@Query(ParseQueryPipe) query: PagedPageTemplateQueryDto, @User() requestUser: RequestUser) {
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
        type: TemplatePresetType.Page,
        fields: ['id', 'name', 'title', 'author', 'status', 'commentStatus', 'commentCount', 'updatedAt', 'createdAt'],
        requestUserId: requestUser ? Number(requestUser.sub) : undefined,
      })
      .lastValue();

    return this.success({
      data: templates,
    });
  }

  /**
   * Create page template
   */
  @Post()
  @RamAuthorized(PageTemplateAction.Create)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiCreatedResponse({
    description: 'Page template model',
    type: () => createResponseSuccessType({ data: PageTemplateModelResp }, 'PageTemplateModelSuccessResp'),
  })
  async create(@Body() input: NewPageTemplateDto, @User() requestUser: RequestUser) {
    const {
      template: { id, name, title, author, content, status, commentStatus, commentCount, updatedAt, createdAt },
    } = await this.templateServiceClient
      .createPage({
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
        name,
        title,
        author,
        content,
        status,
        commentStatus,
        commentCount,
        updatedAt,
        createdAt,
      },
    });
  }

  /**
   * Update page template
   */
  @Put(':id')
  @RamAuthorized(PageTemplateAction.Update)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}, 'UpdatePageTemplateModelSuccessResp'),
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidatePayloadExistsPipe) input: UpdatePageTemplateDto,
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
