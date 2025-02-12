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
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  createResponseSuccessType,
  ParseQueryPipe,
  ValidatePayloadExistsPipe,
  ApiAuthCreate,
  User,
  RequestUser,
  OptionPresetKeys,
  TemplatePresetType,
  TermPresetTaxonomy,
  INFRASTRUCTURE_SERVICE,
  TemplatePattern,
  OptionPattern,
} from '@ace-pomelo/shared/server';
import { Authorized, Anonymous } from '@ace-pomelo/nestjs-authorization';
import { RamAuthorized } from '@ace-pomelo/nestjs-ram-authorization';
import { PageTemplateAction } from '@/common/actions';
import { BaseController } from '@/common/controllers/base.controller';
import { MetaModelResp } from '@/common/controllers/resp/meta-model.resp';
import { PageTemplateOptionQueryDto, PagedPageTemplateQueryDto } from './dto/template-query.dto';
import { NewPageTemplateDto } from './dto/new-template.dto';
import {
  PageTemplateModelResp,
  PageTemplateWithMetasModelResp,
  PagedPageTemplateResp,
  PageTemplateOptionResp,
} from './resp/page-model.resp';
import { UpdatePageTemplateDto } from './dto/update-template.dto';

/**
 * 表单 Restful Api 控制器
 */
@ApiTags('templates/page')
@Authorized()
@Controller({ path: 'api/template/pages', scope: Scope.REQUEST })
export class PageTemplateController extends BaseController {
  constructor(@Inject(INFRASTRUCTURE_SERVICE) protected readonly basicService: ClientProxy) {
    super();
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
    const result = await this.basicService
      .send<PageTemplateOptionResp[]>(TemplatePattern.GetOptions, {
        query: {
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
          ].filter(Boolean),
        },
        type: TemplatePresetType.Page,
        fields: ['id', 'name', 'title'],
      })
      .lastValue();
    return this.success({
      data: result,
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
    const result = await this.basicService
      .send<string[]>(TemplatePattern.GetNames, { type: TemplatePresetType.Page })
      .lastValue();
    return this.success({
      data: result,
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
    const result = name
      ? await this.basicService
          .send<PageTemplateModelResp | undefined>(TemplatePattern.GetByName, {
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
      : await this.basicService
          .send<string | undefined>(OptionPattern.GetValue, {
            optionName: OptionPresetKeys.PageOnFront,
          })
          .lastValue()
          .then((id) => {
            if (id) {
              return this.basicService
                .send<PageTemplateModelResp | undefined>(TemplatePattern.Get, {
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
            return undefined;
          });

    let metas;
    if (result) {
      metas = await this.basicService
        .send<MetaModelResp[]>(TemplatePattern.GetMetas, {
          templateId: result.id,
          metaKeys,
          fields: ['id', 'metaKey', 'metaValue'],
        })
        .lastValue();
    }

    if (result === undefined) {
      res.status(HttpStatus.NO_CONTENT);
    }

    return this.success({
      data: {
        ...result,
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
    const result = await this.basicService
      .send<PageTemplateModelResp | undefined>(TemplatePattern.Get, {
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
    if (result) {
      metas = await this.basicService
        .send<MetaModelResp[]>(TemplatePattern.GetMetas, {
          templateId: result.id,
          metaKeys,
          fields: ['id', 'metaKey', 'metaValue'],
        })
        .lastValue();
    }

    if (result === undefined) {
      res.status(HttpStatus.NO_CONTENT);
    }

    return this.success({
      data: {
        ...result,
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
    const result = await this.basicService
      .send<PagedPageTemplateResp>(TemplatePattern.GetPaged, {
        query: {
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
          ].filter(Boolean),
        },
        type: TemplatePresetType.Page,
        fields: ['id', 'name', 'title', 'author', 'status', 'createdAt'],
        requestUserId: requestUser ? Number(requestUser.sub) : undefined,
      })
      .lastValue();

    return this.success({
      data: result,
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
    const { id, name, title, author, content, status, commentStatus, commentCount, updatedAt, createdAt } =
      await this.basicService
        .send<PageTemplateModelResp>(TemplatePattern.CreatePage, {
          ...input,
          requestUserId: Number(requestUser.sub),
        })
        .lastValue();

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
      await this.basicService
        .send<void>(TemplatePattern.UpdatePage, {
          ...input,
          id,
          requestUserId: Number(requestUser.sub),
        })
        .lastValue();
      return this.success();
    } catch (e: any) {
      this.logger.error(e);
      return this.faild(e.message);
    }
  }

  /**
   * Delete page template permanently
   */
  // @Delete(':id')
  // @RamAuthorized(PageTemplateAction.Delete)
  // @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  // @ApiOkResponse({
  //   description: 'no data content',
  //   type: () => createResponseSuccessType({}, 'DeletePageTemplateModelSuccessResp'),
  // })
  // @ApiUnauthorizedResponse()
  // @ApiForbiddenResponse()
  // async delete(@Param('id', ParseIntPipe) id: number, @User() requestUser: RequestUser) {
  //   await this.templateDataSource.delete(id, requestUser);
  //   return this.success();
  // }
}
