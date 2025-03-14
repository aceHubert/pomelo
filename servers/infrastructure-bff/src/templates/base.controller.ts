import { Response } from 'express';
import { ApiTags, ApiQuery, ApiBody, ApiOkResponse, ApiCreatedResponse, ApiNoContentResponse } from '@nestjs/swagger';
import {
  Inject,
  Controller,
  Param,
  Query,
  Body,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  ParseIntPipe,
  ParseEnumPipe,
  ParseArrayPipe,
  ValidationPipe,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Authorized, Anonymous } from '@ace-pomelo/nestjs-authorization';
import { RamAuthorized } from '@ace-pomelo/nestjs-ram-authorization';
import {
  createResponseSuccessType,
  ApiAuthCreate,
  User,
  ParseQueryPipe,
  ValidatePayloadExistsPipe,
  QueryRequired,
  RequestUser,
  TemplateStatus,
  TermPresetTaxonomy,
  INFRASTRUCTURE_SERVICE,
  TemplatePattern,
} from '@ace-pomelo/shared/server';
import { TemplateAction } from '@/common/actions';
import { createMetaController } from '@/common/controllers/meta.controller';
import { MetaModelResp } from '@/common/controllers/resp/meta-model.resp';
import { NewTemplateMetaDto } from './dto/new-template-meta.dto';
import { PagedBaseTemplateQueryDto, BaseTemplateOptionQueryDto } from './dto/template-query.dto';
import { NewTemplateDto } from './dto/new-template.dto';
import { UpdateTemplateDto, BulkUpdateTemplateStatusDto } from './dto/update-template.dto';
import {
  TemplateModelResp,
  TemplateOptionResp,
  PagedTemplateResp,
  TemplateWithMetasModelResp,
  TemplateMetaModelResp,
  TemplateStatusCount,
  TemplateDayCount,
  TemplateMonthCount,
  TemplateYearCount,
} from './resp/base.resp';

@ApiTags('templates')
@Authorized()
@Controller('api/templates')
export class TemplateController extends createMetaController('template', TemplateMetaModelResp, NewTemplateMetaDto, {
  authDecorator: (method) => {
    const ramAction =
      method === 'getMeta'
        ? TemplateAction.MetaDetail
        : method === 'getMetas'
        ? TemplateAction.MetaList
        : method === 'createMeta' || method === 'createMetas'
        ? TemplateAction.MetaCreate
        : method === 'updateMeta' || method === 'updateMetaByKey'
        ? TemplateAction.MetaUpdate
        : TemplateAction.MetaDelete;

    return method === 'getMeta' || method === 'getMetas'
      ? [RamAuthorized(ramAction), Anonymous()]
      : [RamAuthorized(ramAction), ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])];
  },
}) {
  constructor(@Inject(INFRASTRUCTURE_SERVICE) protected readonly basicService: ClientProxy) {
    super(basicService);
  }

  /**
   *  Get template options
   */
  @Get('options')
  @Anonymous()
  @ApiOkResponse({
    description: 'Template options',
    type: () => createResponseSuccessType({ data: [TemplateOptionResp] }, 'TemplateOptionModelsSuccessResp'),
  })
  async getOptions(@Query(ParseQueryPipe) query: BaseTemplateOptionQueryDto) {
    const { type, categoryId, categoryName, ...restQuery } = query;
    const result = await this.basicService
      .send<TemplateOptionResp[]>(TemplatePattern.GetOptions, {
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
        type,
      })
      .lastValue();
    return this.success({
      data: result,
    });
  }

  /**
   * get template count by status
   */
  @Get('count/:type/by/status')
  @RamAuthorized(TemplateAction.Counts)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Count by status',
    type: () => createResponseSuccessType({ data: [TemplateStatusCount] }, 'TemplateCountByStatusModelSuccessResp'),
  })
  async getCountByStatus(@Param('type') type: string, @User() requestUser: RequestUser) {
    const result = await this.basicService
      .send<
        Array<{
          status: TemplateStatus;
          count: number;
        }>
      >(TemplatePattern.CountByStatus, {
        type,
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();
    return this.success({
      data: result,
    });
  }

  /**
   * Get template count by self
   */
  @Get('count/:type/by/self')
  @RamAuthorized(TemplateAction.Counts)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiQuery({
    name: 'includeTrash',
    type: Boolean,
    example: '202210',
    description: 'Include "Trash" status datas.',
  })
  @ApiOkResponse({
    description: 'Count',
    type: () => createResponseSuccessType({ data: Number }, 'TemplateCountBySelfModelSuccessResp'),
  })
  async getCountBySelf(
    @Param('type') type: string,
    @Query('includeTrash') includeTrash: boolean,
    @User() requestUser: RequestUser,
  ) {
    const result = await this.basicService
      .send<number>(TemplatePattern.CountBySelf, {
        type,
        includeTrashStatus: !!includeTrash,
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();
    return this.success({
      data: result,
    });
  }

  /**
   * Get template count by day
   */
  @Get('count/:type/by/day')
  @RamAuthorized(TemplateAction.Counts)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiQuery({
    name: 'month',
    type: String,
    required: true,
    example: '202210',
    description: `Month (format：yyyyMM).`,
  })
  @ApiOkResponse({
    description: 'Count by day',
    type: () => createResponseSuccessType({ data: [TemplateDayCount] }, 'TemplateCountByDayModelSuccessResp'),
  })
  async getCountByDay(@QueryRequired('month') month: string, @Param('type') type: string) {
    const result = await this.basicService
      .send<Array<{ day: string; count: number }>>(TemplatePattern.CountByDay, {
        month,
        type,
      })
      .lastValue();
    return this.success({
      data: result,
    });
  }

  /**
   * Get template count by month
   */
  @Get('count/:type/by/month')
  @RamAuthorized(TemplateAction.Counts)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiQuery({
    name: 'year',
    type: String,
    required: false,
    example: '2022',
    description: `Year (format：yyyy).`,
  })
  @ApiQuery({
    name: 'months',
    type: Number,
    required: false,
    example: 12,
    description: `Latest number of months from current (default: 12).`,
  })
  @ApiOkResponse({
    description: 'Count by month',
    type: () => createResponseSuccessType({ data: [TemplateMonthCount] }, 'TemplateCountByMonthModelSuccessResp'),
  })
  async getCountByMonth(
    @Query('months', ParseIntPipe) months: number,
    @Query('year') year: string,
    @Param('type') type: string,
  ) {
    const result = await this.basicService
      .send<Array<{ month: string; count: number }>>(TemplatePattern.CountByMonth, { months, year, type })
      .lastValue();
    return this.success({
      data: result,
    });
  }

  /**
   * Get template count by year
   */
  @Get('count/:type/by/year')
  @RamAuthorized(TemplateAction.Counts)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Count by year',
    type: () => createResponseSuccessType({ data: [TemplateYearCount] }, 'TemplateCountByYearModelSuccessResp'),
  })
  async getCountByYear(@Param('type') type: string) {
    const result = await this.basicService
      .send<Array<{ year: string; count: number }>>(TemplatePattern.CountByYear, {
        type,
      })
      .lastValue();
    return this.success({
      data: result,
    });
  }

  /**
   * Get template model by alias name
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
    description: 'Post template model',
    type: () => createResponseSuccessType({ data: TemplateModelResp }, 'PostTemplateModelSuccessResp'),
  })
  @ApiNoContentResponse({ description: 'Post template not found' })
  async getByName(
    @Param('name') name: string,
    @Query('metaKeys', new ParseArrayPipe({ optional: true })) metaKeys: string[] | undefined,
    @Res({ passthrough: true }) res: Response,
    @User() requestUser?: RequestUser,
  ) {
    const result = await this.basicService
      .send<TemplateModelResp | undefined>(TemplatePattern.GetByName, {
        name,
        fields: [
          'id',
          'name',
          'title',
          'author',
          'excerpt',
          'content',
          'status',
          'type',
          'commentStatus',
          'commentCount',
          'updatedAt',
          'createdAt',
        ],
        requestUserId: requestUser ? Number(requestUser.sub) : undefined,
      })
      .lastValue();

    let metas;
    if (result && metaKeys?.length) {
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
   * Get template model by id
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
    description: 'Template model',
    type: () => createResponseSuccessType({ data: TemplateWithMetasModelResp }, 'TemplateModelSuccessResp'),
  })
  @ApiNoContentResponse({
    description: 'Template not found',
  })
  async get(
    @Param('id', ParseIntPipe) id: number,
    @Query('metaKeys', new ParseArrayPipe({ optional: true })) metaKeys: string[] | undefined,
    @Res({ passthrough: true }) res: Response,
    @User() requestUser?: RequestUser,
  ) {
    const result = await this.basicService
      .send<TemplateModelResp | undefined>(TemplatePattern.Get, {
        id,
        fields: [
          'id',
          'name',
          'title',
          'author',
          'excerpt',
          'content',
          'status',
          'type',
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
   * Get paged templates
   */
  @Get()
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Paged template models',
    type: () => createResponseSuccessType({ data: PagedTemplateResp }, 'PagedTemplateSuccessResp'),
  })
  async getPaged(@Query(ParseQueryPipe) query: PagedBaseTemplateQueryDto, @User() requestUser: RequestUser) {
    const { type, categoryId, categoryName, ...restQuery } = query;
    const result = await this.basicService
      .send<PagedTemplateResp>(TemplatePattern.GetPaged, {
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
        type,
        fields: [
          'id',
          'name',
          'title',
          'author',
          'excerpt',
          'status',
          'type',
          'commentStatus',
          'commentCount',
          'updatedAt',
          'createdAt',
        ],
        requestUserId: requestUser ? Number(requestUser.sub) : undefined,
      })
      .lastValue();

    return this.success({
      data: result,
    });
  }

  /**
   * Create template
   */
  @Post()
  @RamAuthorized(TemplateAction.Create)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiCreatedResponse({
    description: 'Template model',
    type: () => createResponseSuccessType({ data: TemplateModelResp }, 'TemplateModelSuccessResp'),
  })
  async create(@Body() input: NewTemplateDto, @User() requestUser: RequestUser) {
    const { id, title, author, excerpt, content, type, status, commentStatus, commentCount, updatedAt, createdAt } =
      await this.basicService
        .send<TemplateModelResp>(TemplatePattern.Create, {
          ...input,
          excerpt: input.excerpt || '',
          requestUserId: Number(requestUser.sub),
        })
        .lastValue();
    return this.success({
      data: {
        id,
        title,
        author,
        content,
        excerpt,
        status,
        type,
        commentStatus,
        commentCount,
        updatedAt,
        createdAt,
      },
    });
  }

  /**
   * Update template
   */
  @Put(':id')
  @RamAuthorized(TemplateAction.Update)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}, 'UpdateTemplateModelSuccessResp'),
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidatePayloadExistsPipe) input: UpdateTemplateDto,
    @User() requestUser: RequestUser,
  ) {
    try {
      await this.basicService
        .send<void>(TemplatePattern.Update, {
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
   * Update template name (must not be in "trash" status)
   */
  @Patch(':id/name')
  @RamAuthorized(TemplateAction.UpdateName)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: '"true" if success or "false" if template does not exist or name ',
    type: () => createResponseSuccessType({}, 'UpdateTemplateModelSuccessResp'),
  })
  async updateName(
    @Param('id', ParseIntPipe) id: number,
    @Query('name', new ValidationPipe({ expectedType: String })) name: string,
    @User() requestUser: RequestUser,
  ) {
    try {
      await this.basicService
        .send<void>(TemplatePattern.UpdateName, {
          id,
          name,
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
   * Update template status (must not be in "trash" status)
   */
  @Patch(':id/status')
  @RamAuthorized(TemplateAction.UpdateStatus)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: '"true" if success or "false" if template does not exist',
    type: () => createResponseSuccessType({}, 'UpdateTemplateStatusModelSuccessResp'),
  })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Query('status', new ParseEnumPipe(TemplateStatus)) status: TemplateStatus,
    @User() requestUser: RequestUser,
  ) {
    try {
      await this.basicService
        .send<void>(TemplatePattern.UpdateStatus, {
          id,
          status,
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
   * Update the bulk of templates' status (must not be in "trash" status)
   */
  @Patch('status/bulk')
  @RamAuthorized(TemplateAction.BulkUpdateStatus)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}, 'BulkUpdateTemplateStatusModelSuccessResp'),
  })
  async bulkUpdateStatus(@Body() model: BulkUpdateTemplateStatusDto, @User() requestUser: RequestUser) {
    try {
      await this.basicService
        .send<void>(TemplatePattern.BulkUpdateStatus, {
          ...model,
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
   * Restore template (must be in "trash" status)
   */
  @Patch(':id/restore')
  @RamAuthorized(TemplateAction.Restore)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}, 'RestoreTemplateModelSuccessResp'),
  })
  async restore(@Param('id', ParseIntPipe) id: number, @User() requestUser: RequestUser) {
    try {
      await this.basicService
        .send<void>(TemplatePattern.Restore, {
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
   * Restore the bulk of templates (must be in "trash" status)
   */
  @Patch('restore/bulk')
  @RamAuthorized(TemplateAction.BulkRestore)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiBody({ type: () => [Number], description: 'Template ids' })
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}, 'BulkRestoreTemplateModelSuccessResp'),
  })
  async bulkRestore(@Body() ids: number[], @User() requestUser: RequestUser) {
    try {
      await this.basicService
        .send<void>(TemplatePattern.BulkRestore, {
          ids,
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
   * Delete template permanently (must be in "trash" status)
   */
  @Delete(':id')
  @RamAuthorized(TemplateAction.Delete)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}, 'DeleteTemplateModelSuccessResp'),
  })
  async delete(@Param('id', ParseIntPipe) id: number, @User() requestUser: RequestUser) {
    try {
      await this.basicService
        .send<void>(TemplatePattern.Delete, {
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
   * Delete the bulk of templates permanently (must be in "trash" status)'
   */
  @Delete('/bulk')
  @RamAuthorized(TemplateAction.BulkDelete)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiBody({ type: () => [Number], description: 'Template ids' })
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}, 'BulkDeleteTemplateModelSuccessResp'),
  })
  async bulkDelete(@Body() ids: number[], @User() requestUser: RequestUser) {
    try {
      await this.basicService
        .send<void>(TemplatePattern.BulkDelete, {
          ids,
          requestUserId: Number(requestUser.sub),
        })
        .lastValue();
      return this.success();
    } catch (e: any) {
      this.logger.error(e);
      return this.faild(e.message);
    }
  }
}
