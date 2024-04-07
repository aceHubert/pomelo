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
import {
  createResponseSuccessType,
  ApiAuthCreate,
  ParseQueryPipe,
  ValidatePayloadExistsPipe,
  User,
  RequestUser,
} from '@ace-pomelo/shared-server';
import {
  TemplateDataSource,
  PagedTemplateArgs,
  TemplateOptionArgs,
  TemplatePresetType,
  TermPresetTaxonomy,
} from '@ace-pomelo/infrastructure-datasource';
import { Authorized, Anonymous } from '@ace-pomelo/nestjs-oidc';
import { RamAuthorized } from '@ace-pomelo/ram-authorization';
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
      TemplatePresetType.Form,
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
    @Res({ passthrough: true }) res: Response,
    @User() requestUser?: RequestUser,
  ) {
    const result = await this.templateDataSource.get(
      id,
      TemplatePresetType.Form,
      ['id', 'title', 'author', 'content', 'status', 'updatedAt', 'createdAt'],
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
   * Get paged form template model
   */
  @Get()
  @Anonymous()
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
      TemplatePresetType.Form,
      ['id', 'title', 'author', 'status', 'updatedAt', 'createdAt'],
      requestUser ? Number(requestUser.sub) : undefined,
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
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiCreatedResponse({
    description: 'From template model',
    type: () => createResponseSuccessType({ data: FormTemplateModelResp }, 'FormTemplateModelSuccessResp'),
  })
  async create(@Body() input: NewFormTemplateDto, @User() requestUser: RequestUser) {
    const { id, title, author, content, status, updatedAt, createdAt } = await this.templateDataSource.create(
      input,
      TemplatePresetType.Form,
      Number(requestUser.sub),
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
      await this.templateDataSource.update(id, input, Number(requestUser.sub));
      return this.success();
    } catch (e: any) {
      this.logger.error(e);
      return this.faild(e.message);
    }
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
