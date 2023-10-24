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
  BaseController,
  ParseQueryPipe,
  ValidatePayloadExistsPipe,
  ApiAuth,
  User,
  RequestUser,
  createResponseSuccessType,
} from '@pomelo/shared-server';
import { TemplateDataSource, PagedTemplateArgs, TemplateOptionArgs, Taxonomy, TemplateType } from '@pomelo/datasource';
import { Authorized, Anonymous } from 'nestjs-authorization';
import { RamAuthorized } from 'nestjs-ram-authorization';
import { PageTemplateAction } from '@/common/actions';
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
  constructor(private readonly templateDataSource: TemplateDataSource) {
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
          (categoryId !== void 0 || categoryName !== void 0) && {
            taxonomyType: Taxonomy.Category,
            taxonomyId: categoryId,
            taxonomyName: categoryName,
          },
        ].filter(Boolean) as TemplateOptionArgs['taxonomies'],
      },
      TemplateType.Page,
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
    const result = await this.templateDataSource.getNames(TemplateType.Page);
    return this.success({
      data: result,
    });
  }

  /**
   * Get page template model by alias name
   */
  @Get(':name/alias')
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
    type: () => createResponseSuccessType({ data: PageTemplateModelResp }, 'PageTemplateModelSuccessResp'),
  })
  @ApiNoContentResponse({ description: 'Page template not found' })
  async getByName(
    @Param('name') name: string,
    @Query('metaKeys', new ParseArrayPipe({ optional: true })) metaKeys: string[] | undefined,
    @User() requestUser: RequestUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.templateDataSource.getByName(
      name,
      TemplateType.Page,
      ['id', 'name', 'title', 'author', 'content', 'status', 'commentStatus', 'commentCount', 'updatedAt', 'createdAt'],
      requestUser,
    );

    let metas;
    if (result) {
      metas = await this.templateDataSource.getMetas(result.id, metaKeys, ['id', 'metaKey', 'metaValue']);
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
    @User() requestUser: RequestUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.templateDataSource.get(
      id,
      TemplateType.Page,
      ['id', 'name', 'title', 'author', 'content', 'status', 'commentStatus', 'commentCount', 'updatedAt', 'createdAt'],
      requestUser,
    );

    let metas;
    if (result) {
      metas = await this.templateDataSource.getMetas(id, metaKeys, ['id', 'metaKey', 'metaValue']);
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
  @RamAuthorized(PageTemplateAction.PagedList)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
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
          (categoryId !== void 0 || categoryName !== void 0) && {
            taxonomyType: Taxonomy.Category,
            taxonomyId: categoryId,
            taxonomyName: categoryName,
          },
        ].filter(Boolean) as PagedTemplateArgs['taxonomies'],
      },
      TemplateType.Page,
      ['id', 'name', 'title', 'author', 'status', 'createdAt'],
      requestUser,
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
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiCreatedResponse({
    description: 'Page template model',
    type: () => createResponseSuccessType({ data: PageTemplateModelResp }, 'PageTemplateModelSuccessResp'),
  })
  async create(@Body() input: NewPageTemplateDto, @User() requestUser: RequestUser) {
    const { id, name, title, author, content, status, commentStatus, commentCount, updatedAt, createdAt } =
      await this.templateDataSource.create(input, TemplateType.Page, requestUser);

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
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}, 'UpdatePageTemplateModelSuccessResp'),
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidatePayloadExistsPipe) input: UpdatePageTemplateDto,
    @User() requestUser: RequestUser,
  ) {
    await this.templateDataSource.update(id, input, requestUser);
    return this.success();
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
