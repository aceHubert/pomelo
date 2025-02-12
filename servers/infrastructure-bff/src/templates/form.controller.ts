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
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  createResponseSuccessType,
  ApiAuthCreate,
  ParseQueryPipe,
  ValidatePayloadExistsPipe,
  User,
  RequestUser,
  TemplatePresetType,
  TermPresetTaxonomy,
  INFRASTRUCTURE_SERVICE,
  TemplatePattern,
} from '@ace-pomelo/shared/server';
import { Authorized, Anonymous } from '@ace-pomelo/nestjs-authorization';
import { RamAuthorized } from '@ace-pomelo/nestjs-ram-authorization';
import { FormTemplateAction } from '@/common/actions';
import { BaseController } from '@/common/controllers/base.controller';
import { MetaModelResp } from '@/common/controllers/resp/meta-model.resp';
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
  constructor(@Inject(INFRASTRUCTURE_SERVICE) protected readonly basicService: ClientProxy) {
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
    const result = await this.basicService
      .send<FormTemplateOptionResp[]>(TemplatePattern.GetOptions, {
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
        type: TemplatePresetType.Form,
      })
      .lastValue();
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
    const result = await this.basicService
      .send<FormTemplateModelResp | undefined>(TemplatePattern.Get, {
        id,
        type: TemplatePresetType.Form,
        fields: ['id', 'title', 'author', 'content', 'status', 'updatedAt', 'createdAt'],
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
    const result = await this.basicService
      .send<PagedFormTemplateResp>(TemplatePattern.GetPaged, {
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
        type: TemplatePresetType.Form,
        fields: ['id', 'title', 'author', 'status', 'updatedAt', 'createdAt'],
        requestUserId: requestUser ? Number(requestUser.sub) : undefined,
      })
      .lastValue();

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
    const { id, title, author, content, status, updatedAt, createdAt } = await this.basicService
      .send<FormTemplateModelResp>(TemplatePattern.CreateForm, {
        ...input,
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();
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
      await this.basicService
        .send<void>(TemplatePattern.UpdateForm, {
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
