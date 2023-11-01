import { Response } from 'express';
import { ApiTags, ApiQuery, ApiBody, ApiOkResponse, ApiCreatedResponse, ApiNoContentResponse } from '@nestjs/swagger';
import {
  Controller,
  Param,
  Query,
  Get,
  Post,
  Patch,
  Put,
  ParseIntPipe,
  ParseEnumPipe,
  ParseArrayPipe,
  ValidationPipe,
  Body,
  Delete,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { I18n, I18nContext } from 'nestjs-i18n';
import { ModuleRef } from '@nestjs/core';
import { Authorized, Anonymous } from '@pomelo/authorization';
import { RamAuthorized } from '@pomelo/ram-authorization';
import {
  ApiAuth,
  User,
  ParseQueryPipe,
  ValidatePayloadExistsPipe,
  QueryRequired,
  createResponseSuccessType,
  RequestUser,
} from '@pomelo/shared-server';
import {
  TemplateDataSource,
  PagedTemplateArgs,
  TemplateOptionArgs,
  Taxonomy,
  TemplateStatus,
} from '@pomelo/datasource';
import { TemplateAction } from '@/common/actions';
import { createMetaController } from '@/common/controllers/meta.controller';
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
export class TemplateController extends createMetaController(
  'template',
  TemplateMetaModelResp,
  NewTemplateMetaDto,
  TemplateDataSource,
  {
    authDecorator: ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN]),
  },
) {
  constructor(protected readonly moduleRef: ModuleRef, private readonly templateDataSource: TemplateDataSource) {
    super(moduleRef);
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
      type,
    );
    return this.success({
      data: result,
    });
  }

  /**
   * get template count by status
   */
  @Get('count/:type/by/status')
  @RamAuthorized(TemplateAction.Counts)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Count by status',
    type: () => createResponseSuccessType({ data: [TemplateStatusCount] }, 'TemplateCountByStatusModelSuccessResp'),
  })
  async getCountByStatus(@Param('type') type: string, @User() requestUser: RequestUser) {
    const result = await this.templateDataSource.getCountByStatus(type, requestUser);
    return this.success({
      data: result,
    });
  }

  /**
   * Get template count by self
   */
  @Get('count/:type/by/self')
  @RamAuthorized(TemplateAction.Counts)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
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
    const result = await this.templateDataSource.getCountBySelf(type, !!includeTrash, requestUser);
    return this.success({
      data: result,
    });
  }

  /**
   * Get template count by day
   */
  @Get('count/:type/by/day')
  @RamAuthorized(TemplateAction.Counts)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
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
    const result = await this.templateDataSource.getCountByDay(month, type);
    return this.success({
      data: result,
    });
  }

  /**
   * Get template count by month
   */
  @Get('count/:type/by/month')
  @RamAuthorized(TemplateAction.Counts)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
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
    const result = await this.templateDataSource.getCountByMonth({ months, year }, type);
    return this.success({
      data: result,
    });
  }

  /**
   * Get template count by year
   */
  @Get('count/:type/by/year')
  @RamAuthorized(TemplateAction.Counts)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Count by year',
    type: () => createResponseSuccessType({ data: [TemplateYearCount] }, 'TemplateCountByYearModelSuccessResp'),
  })
  async getCountByYear(@Param('type') type: string) {
    const result = await this.templateDataSource.getCountByYear(type);
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
    @User() requestUser: RequestUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.templateDataSource.getByName(
      name,
      'NONE',
      [
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
      requestUser,
    );

    let metas;
    if (result && metaKeys?.length) {
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
    @User() requestUser: RequestUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.templateDataSource.get(
      id,
      'NONE',
      [
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
      requestUser,
    );

    let metas;
    if (result) {
      metas = await this.templateDataSource.getMetas(id, metaKeys ?? 'ALL', [
        'id',
        'templateId',
        'metaKey',
        'metaValue',
      ]);
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
   * Get paged template model
   */
  @Get()
  @RamAuthorized(TemplateAction.PagedList)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Paged template models',
    type: () => createResponseSuccessType({ data: PagedTemplateResp }, 'PagedTemplateSuccessResp'),
  })
  async getPaged(@Query(ParseQueryPipe) query: PagedBaseTemplateQueryDto, @User() requestUser: RequestUser) {
    const { type, categoryId, categoryName, ...restQuery } = query;
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
      type,
      [
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
      requestUser,
    );

    return this.success({
      data: result,
    });
  }

  /**
   * Create template
   */
  @Post()
  @RamAuthorized(TemplateAction.Create)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiCreatedResponse({
    description: 'Template model',
    type: () => createResponseSuccessType({ data: TemplateModelResp }, 'TemplateModelSuccessResp'),
  })
  async create(@Body() input: NewTemplateDto, @User() requestUser: RequestUser) {
    const { type, ...restDto } = input;
    const { id, title, author, excerpt, content, status, commentStatus, commentCount, updatedAt, createdAt } =
      await this.templateDataSource.create({ ...restDto, excerpt: restDto.excerpt || '' }, type, requestUser);
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
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}, 'UpdateTemplateModelSuccessResp'),
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidatePayloadExistsPipe) model: UpdateTemplateDto,
    @User() requestUser: RequestUser,
  ) {
    await this.templateDataSource.update(id, model, requestUser);
    return this.success();
  }

  /**
   * Update template name (must not be in "trash" status)
   */
  @Patch(':id/name')
  @RamAuthorized(TemplateAction.UpdateName)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: '"true" if success or "false" if template does not exist or name ',
    type: () => createResponseSuccessType({}, 'UpdateTemplateModelSuccessResp'),
  })
  async updateName(
    @Param('id', ParseIntPipe) id: number,
    @Query('name', new ValidationPipe({ expectedType: String })) name: string,
    @User() requestUser: RequestUser,
    @I18n() i18n: I18nContext,
  ) {
    const result = await this.templateDataSource.updateName(id, name, requestUser);
    if (result) {
      return this.success();
    } else {
      return this.faild(
        await i18n.tv('templates.controller.template_does_not_exist', `Template "${id}" does not exist！`, {
          args: { id },
        }),
        400,
      );
    }
  }

  /**
   * Update template status (must not be in "trash" status)
   */
  @Patch(':id/status')
  @RamAuthorized(TemplateAction.UpdateStatus)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: '"true" if success or "false" if template does not exist',
    type: () => createResponseSuccessType({}, 'UpdateTemplateStatusModelSuccessResp'),
  })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Query('status', new ParseEnumPipe(TemplateStatus)) status: TemplateStatus,
    @User() requestUser: RequestUser,
    @I18n() i18n: I18nContext,
  ) {
    const result = await this.templateDataSource.updateStatus(id, status, requestUser);
    if (result) {
      return this.success();
    } else {
      return this.faild(
        await i18n.tv('templates.controller.template_does_not_exist', `Template "${id}" does not exist！`, {
          args: { id },
        }),
        400,
      );
    }
  }

  /**
   * Update the bulk of templates' status (must not be in "trash" status)
   */
  @Patch('status/bulk')
  @RamAuthorized(TemplateAction.BulkUpdateStatus)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}, 'BulkUpdateTemplateStatusModelSuccessResp'),
  })
  async bulkUpdateStatus(@Body() model: BulkUpdateTemplateStatusDto, @User() requestUser: RequestUser) {
    await this.templateDataSource.bulkUpdateStatus(model.templateIds, model.status, requestUser);
    return this.success();
  }

  /**
   * Restore template (must be in "trash" status)
   */
  @Patch(':id/restore')
  @RamAuthorized(TemplateAction.Restore)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}, 'RestoreTemplateModelSuccessResp'),
  })
  async restore(@Param('id', ParseIntPipe) id: number, @User() requestUser: RequestUser, @I18n() i18n: I18nContext) {
    const result = await this.templateDataSource.restore(id, requestUser);
    if (result) {
      return this.success();
    } else {
      return this.faild(
        await i18n.tv('templates.controller.template_does_not_exist', `Template "${id}" does not exist！`, {
          args: { id },
        }),
        400,
      );
    }
  }

  /**
   * Restore the bulk of templates (must be in "trash" status)
   */
  @Patch('restore/bulk')
  @RamAuthorized(TemplateAction.BulkRestore)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiBody({ type: () => [Number], description: 'Template ids' })
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}, 'BulkRestoreTemplateModelSuccessResp'),
  })
  async bulkRestore(@Body() ids: number[], @User() requestUser: RequestUser) {
    await this.templateDataSource.bulkRestore(ids, requestUser);
    return this.success();
  }

  /**
   * Delete template permanently (must be in "trash" status)
   */
  @Delete(':id')
  @RamAuthorized(TemplateAction.Delete)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}, 'DeleteTemplateModelSuccessResp'),
  })
  async delete(@Param('id', ParseIntPipe) id: number, @User() requestUser: RequestUser, @I18n() i18n: I18nContext) {
    const result = await this.templateDataSource.delete(id, requestUser);
    if (result) {
      return this.success();
    } else {
      return this.faild(
        await i18n.tv('templates.controller.template_does_not_exist', `Template "${id}" does not exist！`, {
          args: { id },
        }),
        400,
      );
    }
  }

  /**
   * Delete the bulk of templates permanently (must be in "trash" status)'
   */
  @Delete('/bulk')
  @RamAuthorized(TemplateAction.BulkDelete)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiBody({ type: () => [Number], description: 'Template ids' })
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}, 'BulkDeleteTemplateModelSuccessResp'),
  })
  async bulkDelete(@Body() ids: number[], @User() requestUser: RequestUser) {
    await this.templateDataSource.bulkDelete(ids, requestUser);
    return this.success();
  }
}
