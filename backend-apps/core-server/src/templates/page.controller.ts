import { ApiTags, ApiQuery, ApiOkResponse } from '@nestjs/swagger';
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
  HttpStatus,
} from '@nestjs/common';
import { Authorized, Anonymous, RamAuthorized } from 'nestjs-identity';
import { BaseController } from '@/common/controllers/base.controller';
import { ApiAuth } from '@/common/decorators/api-auth.decorator';
import { Actions } from '@/common/ram-actions';
import { User } from '@/common/decorators/user.decorator';
import { ParseQueryPipe } from '@/common/pipes/parse-query.pipe';
import { createResponseSuccessType } from '@/common/utils/swagger-type.util';
import { Taxonomy, TemplateType } from '@/orm-entities/interfaces';
import { TemplateDataSource } from '@/sequelize-datasources/datasources';
import { PagedTemplateArgs, TemplateOptionArgs } from '@/sequelize-datasources/interfaces';
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
    description: `return specific keys' metas if setted, otherwish no "metas" field return in "data".`,
  })
  @ApiOkResponse({
    description: 'Page template model',
    type: () => createResponseSuccessType({ data: PageTemplateModelResp }, 'PageTemplateModelSuccessResp'),
  })
  async getByName(
    @Param('name') name: string,
    @Query('metaKeys', new ParseArrayPipe({ optional: true })) metaKeys: string[] | undefined,
    @User() requestUser: RequestUser,
  ) {
    const result = await this.templateDataSource.getByName(
      name,
      TemplateType.Page,
      ['id', 'name', 'title', 'author', 'content', 'status', 'createdAt'],
      requestUser,
    );

    if (result) {
      let metas;
      if (metaKeys?.length) {
        metas = await this.templateDataSource.getMetas(result.id, metaKeys, ['id', 'metaKey', 'metaValue']);
      }
      const { content, ...restData } = result;
      return this.success({
        data: {
          ...restData,
          schema: content,
          metas,
        },
      });
    }
    return this.success();
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
    description: `return specific keys' metas if setted, otherwish no "metas" field return in "data".`,
  })
  @ApiOkResponse({
    description: 'Page template model',
    type: () => createResponseSuccessType({ data: PageTemplateWithMetasModelResp }, 'PageTemplateModelSuccessResp'),
  })
  async get(
    @Param('id', ParseIntPipe) id: number,
    @Query('metaKeys', new ParseArrayPipe({ optional: true })) metaKeys: string[] | undefined,
    @User() requestUser: RequestUser,
  ) {
    const result = await this.templateDataSource.get(
      id,
      TemplateType.Page,
      ['id', 'name', 'title', 'author', 'content', 'status', 'createdAt'],
      requestUser,
    );

    if (result) {
      let metas;
      if (metaKeys?.length) {
        metas = await this.templateDataSource.getMetas(id, metaKeys, ['id', 'metaKey', 'metaValue']);
      }
      const { content, ...restData } = result;
      return this.success({
        data: {
          ...restData,
          schema: content,
          metas,
        },
      });
    }
    return this.success();
  }

  /**
   * Get paged page template model
   */
  @Get()
  @RamAuthorized(Actions.PageTemplate.PagedList)
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
  @RamAuthorized(Actions.PageTemplate.Create)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    status: 201,
    description: 'Page template model',
    type: () => createResponseSuccessType({ data: PageTemplateModelResp }, 'PageTemplateModelSuccessResp'),
  })
  async create(@Body() input: NewPageTemplateDto, @User() requestUser: RequestUser) {
    const { schema, ...restDto } = input;
    const { id, name, title, author, content, status, createdAt } = await this.templateDataSource.create(
      { content: schema, ...restDto },
      TemplateType.Page,
      requestUser,
    );
    return this.success({
      data: {
        id,
        name,
        title,
        author,
        schema: content,
        status,
        createdAt,
      },
    });
  }

  /**
   * Update page template
   */
  @Put(':id')
  @RamAuthorized(Actions.PageTemplate.Update)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}, 'UpdatePageTemplateModelSuccessResp'),
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() model: UpdatePageTemplateDto,
    @User() requestUser: RequestUser,
  ) {
    const { schema, ...restDto } = model;
    await this.templateDataSource.update(id, { content: schema, ...restDto }, requestUser);
    return this.success();
  }

  /**
   * Delete page template permanently
   */
  // @Delete(':id')
  // @RamAuthorized(Actions.PageTemplate.Delete)
  // @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  // @ApiOkResponse({
  //   description: 'no data content',
  //   type: () => createResponseSuccessType({}, 'DeletePageTemplateModelSuccessResp'),
  // })
  // @ApiUnauthorizedResponse()
  // @ApiForbiddenResponse()
  // async delete(@Param('id', ParseIntPipe) id: number, @User() requestUser: RequestUser) {
  //   await this.templateDataSource.delete(id, requestUser);
  //   return this.success({});
  // }
}
