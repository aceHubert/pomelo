import { Response } from 'express';
import { ApiTags, ApiQuery, ApiOkResponse, ApiNoContentResponse, ApiCreatedResponse } from '@nestjs/swagger';
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
import { BaseController, ApiAuth, ParseQueryPipe, User, RequestUser, createResponseSuccessType } from '@pomelo/shared';
import { TemplateDataSource, PagedTemplateArgs, TemplateOptionArgs, Taxonomy, TemplateType } from '@pomelo/datasource';
import { Authorized, Anonymous } from 'nestjs-authorization';
import { RamAuthorized } from 'nestjs-ram-authorization';
import { FormTemplateAction } from '@/common/actions';
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
    @User() requestUser: RequestUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.templateDataSource.get(
      id,
      TemplateType.Form,
      ['id', 'title', 'author', 'content', 'status', 'updatedAt', 'createdAt'],
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
   * Get paged form template model
   */
  @Get()
  @RamAuthorized(FormTemplateAction.PagedList)
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
      ['id', 'title', 'author', 'status', 'updatedAt', 'createdAt'],
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
  @RamAuthorized(FormTemplateAction.Create)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiCreatedResponse({
    description: 'From template model',
    type: () => createResponseSuccessType({ data: FormTemplateModelResp }, 'FormTemplateModelSuccessResp'),
  })
  async create(@Body() input: NewFormTemplateDto, @User() requestUser: RequestUser) {
    const { id, title, author, content, status, updatedAt, createdAt } = await this.templateDataSource.create(
      input,
      TemplateType.Form,
      requestUser,
    );
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
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}, 'UpdateFormTemplateSuccessResp'),
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateFormTemplateDto,
    @User() requestUser: RequestUser,
  ) {
    await this.templateDataSource.update(id, input, requestUser);
    return this.success();
  }

  /**
   * Delete form template permanently
   */
  // @Delete(':id')
  // @RamAuthorized(FormTemplateAction.Delete)
  // @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  // @ApiOkResponse({
  //   description: 'no data content',
  //   type: () => createResponseSuccessType({}, 'DeleteFormTemplateSuccessResp'),
  // })
  // @ApiUnauthorizedResponse()
  // @ApiForbiddenResponse()
  // async delete(@Param('id', ParseIntPipe) id: number, @User() requestUser: RequestUser) {
  //   await this.templateDataSource.delete(id, requestUser);
  //   return this.success();
  // }
}
