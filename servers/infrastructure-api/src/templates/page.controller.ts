import { Response } from 'express';
import { ApiTags, ApiQuery, ApiOkResponse, ApiCreatedResponse, ApiNoContentResponse } from '@nestjs/swagger';
import {
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
import {
  createResponseSuccessType,
  ParseQueryPipe,
  ValidatePayloadExistsPipe,
  ApiAuthCreate,
  User,
  RequestUser,
} from '@ace-pomelo/shared-server';
import {
  OptionDataSource,
  OptionPresetKeys,
  TemplateDataSource,
  PagedTemplateArgs,
  TemplateOptionArgs,
  TemplatePresetType,
  TermPresetTaxonomy,
} from '@ace-pomelo/infrastructure-datasource';
import { Authorized, Anonymous } from '@ace-pomelo/nestjs-oidc';
import { RamAuthorized } from '@ace-pomelo/ram-authorization';
import { PageTemplateAction } from '@/common/actions';
import { BaseController } from '@/common/controllers/base.controller';
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
  constructor(
    private readonly optionDataSource: OptionDataSource,
    private readonly templateDataSource: TemplateDataSource,
  ) {
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
    const result = await this.templateDataSource.getOptions(
      {
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
        ].filter(Boolean) as TemplateOptionArgs['taxonomies'],
      },
      TemplatePresetType.Page,
      ['id', 'name', 'title'],
    );
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
    const result = await this.templateDataSource.getNames(TemplatePresetType.Page);
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
      ? await this.templateDataSource.getByName(
          name,
          TemplatePresetType.Page,
          [
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
          requestUser ? Number(requestUser.sub) : undefined,
        )
      : await this.optionDataSource.getOptionValue(OptionPresetKeys.PageOnFront).then((id) => {
          if (id) {
            return this.templateDataSource.get(
              Number(id),
              TemplatePresetType.Page,
              [
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
              requestUser ? Number(requestUser.sub) : undefined,
            );
          }
          return undefined;
        });

    let metas;
    if (result) {
      metas = await this.templateDataSource.getMetas(result.id, metaKeys ?? 'ALL', ['id', 'metaKey', 'metaValue']);
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
    const result = await this.templateDataSource.get(
      id,
      TemplatePresetType.Page,
      ['id', 'name', 'title', 'author', 'content', 'status', 'commentStatus', 'commentCount', 'updatedAt', 'createdAt'],
      requestUser ? Number(requestUser.sub) : undefined,
    );

    let metas;
    if (result) {
      metas = await this.templateDataSource.getMetas(id, metaKeys ?? 'ALL', ['id', 'metaKey', 'metaValue']);
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
   * Get paged page template model
   */
  @Get()
  @Anonymous()
  @ApiOkResponse({
    description: 'Paged pages template models',
    type: () => createResponseSuccessType({ data: PagedPageTemplateResp }, 'PagedPageTemplateSuccessResp'),
  })
  async getPaged(@Query(ParseQueryPipe) query: PagedPageTemplateQueryDto, @User() requestUser: RequestUser) {
    const { categoryId, categoryName, ...restQuery } = query;
    const result = await this.templateDataSource.getPaged(
      {
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
        ].filter(Boolean) as PagedTemplateArgs['taxonomies'],
      },
      TemplatePresetType.Page,
      ['id', 'name', 'title', 'author', 'status', 'createdAt'],
      requestUser ? Number(requestUser.sub) : undefined,
    );

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
      await this.templateDataSource.create(input, TemplatePresetType.Page, Number(requestUser.sub));

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
      await this.templateDataSource.update(id, input, Number(requestUser.sub));
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
