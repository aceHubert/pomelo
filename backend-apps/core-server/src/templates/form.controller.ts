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
export class FormTemplateController extends BaseController {
  constructor(private readonly templateDataSource: TemplateDataSource) {
    super();
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
      TemplateType.Form,
    );
    return this.success({
      data: result,
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
    description: `return specific keys' metas if setted, otherwish no "metas" field return in "data".`,
  })
  @ApiOkResponse({
    description: 'From template model',
    type: () => createResponseSuccessType({ data: FormTemplateWithMetasModelResp }, 'FormTemplateModelSuccessResp'),
  })
  async get(
    @Param('id', ParseIntPipe) id: number,
    @Query('metaKeys', new ParseArrayPipe({ optional: true })) metaKeys: string[] | undefined,
    @User() requestUser: RequestUser,
  ) {
    const result = await this.templateDataSource.get(
      id,
      TemplateType.Form,
      ['id', 'title', 'author', 'content', 'status', 'createdAt'],
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
   * Get paged form template model
   */
  @Get()
  @RamAuthorized(Actions.FormTemplate.PagedList)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Paged from template models',
    type: () => createResponseSuccessType({ data: PagedFormTemplateResp }, 'PagedFormTemplateSuccessResp'),
  })
  async getPaged(@Query(ParseQueryPipe) query: PagedFormTemplateQueryDto, @User() requestUser: RequestUser) {
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
      TemplateType.Form,
      ['id', 'title', 'author', 'status', 'createdAt'],
      requestUser,
    );

    return this.success({
      data: result,
    });
  }

  /**
   * Create form template
   */
  @Post()
  @RamAuthorized(Actions.FormTemplate.Create)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    status: 201,
    description: 'From template model',
    type: () => createResponseSuccessType({ data: FormTemplateModelResp }, 'FormTemplateModelSuccessResp'),
  })
  async create(@Body() input: NewFormTemplateDto, @User() requestUser: RequestUser) {
    const { schema, ...restDto } = input;
    const { id, title, author, content, status, createdAt } = await this.templateDataSource.create(
      { content: schema, ...restDto },
      TemplateType.Form,
      requestUser,
    );
    return this.success({
      data: {
        id,
        title,
        author,
        schema: content,
        status,
        createdAt,
      },
    });
  }

  /**
   * Update form template
   */
  @Put(':id')
  @RamAuthorized(Actions.FormTemplate.Update)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}, 'UpdateFormTemplateSuccessResp'),
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() model: UpdateFormTemplateDto,
    @User() requestUser: RequestUser,
  ) {
    const { schema, ...restDto } = model;
    await this.templateDataSource.update(id, { content: schema, ...restDto }, requestUser);
    return this.success();
  }

  /**
   * Delete form template permanently
   */
  // @Delete(':id')
  // @RamAuthorized(Actions.FormTemplate.Delete)
  // @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  // @ApiOkResponse({
  //   description: 'no data content',
  //   type: () => createResponseSuccessType({}, 'DeleteFormTemplateSuccessResp'),
  // })
  // @ApiUnauthorizedResponse()
  // @ApiForbiddenResponse()
  // async delete(@Param('id', ParseIntPipe) id: number, @User() requestUser: RequestUser) {
  //   await this.templateDataSource.delete(id, requestUser);
  //   return this.success({});
  // }
}
