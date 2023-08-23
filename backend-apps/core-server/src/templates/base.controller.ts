import { ApiTags, ApiQuery, ApiBody, ApiOkResponse } from '@nestjs/swagger';
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
  HttpStatus,
} from '@nestjs/common';
import { I18n, I18nContext } from 'nestjs-i18n';
import { ModuleRef } from '@nestjs/core';
import { Authorized, Anonymous, RamAuthorized } from 'nestjs-identity';
import { createResponseSuccessType } from '@/common/utils/swagger-type.util';
import { ApiAuth } from '@/common/decorators/api-auth.decorator';
import { Actions } from '@/common/ram-actions';
import { User } from '@/common/decorators/user.decorator';
import { QueryRequired } from '@/common/decorators/query-required.decorator';
import { ParseQueryPipe } from '@/common/pipes/parse-query.pipe';
import { createMetaController } from '@/common/controllers/meta.controller';
import { Taxonomy, TemplateStatus } from '@/orm-entities/interfaces';
import { TemplateDataSource } from '@/sequelize-datasources/datasources';
import { PagedTemplateArgs, TemplateOptionArgs } from '@/sequelize-datasources/interfaces';
import { NewTemplateMetaDto } from './dto/new-template-meta.dto';
import { PagedBaseTemplateQueryDto, BaseTemplateOptionQueryDto } from './dto/template-query.dto';
import { NewTemplateDto } from './dto/new-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { BulkUpdateTemplateStatusDto } from './dto/update-template-status.dto';
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
  @RamAuthorized(Actions.BaseTemplate.Counts)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Count by status',
    type: () => createResponseSuccessType({ data: TemplateStatusCount }, 'TemplateCountByStatusModelSuccessResp'),
  })
  getCountByStatus(@Param('type') type: string, @User() requestUser: RequestUser) {
    return this.templateDataSource.getCountByStatus(type, requestUser);
  }

  /**
   * Get template count by self
   */
  @Get('count/:type/by/self')
  @RamAuthorized(Actions.BaseTemplate.Counts)
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
  getCountBySelf(
    @Param('type') type: string,
    @Query('includeTrash') includeTrash: boolean,
    @User() requestUser: RequestUser,
  ) {
    return this.templateDataSource.getCountBySelf(type, !!includeTrash, requestUser);
  }

  /**
   * Get template count by day
   */
  @Get('count/:type/by/day')
  @RamAuthorized(Actions.BaseTemplate.Counts)
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
    type: () => createResponseSuccessType({ data: TemplateDayCount }, 'TemplateCountByDayModelSuccessResp'),
  })
  getCountByDay(@QueryRequired('month') month: string, @Param('type') type: string) {
    return this.templateDataSource.getCountByDay(month, type);
  }

  /**
   * Get template count by month
   */
  @Get('count/:type/by/month')
  @RamAuthorized(Actions.BaseTemplate.Counts)
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
    type: () => createResponseSuccessType({ data: TemplateMonthCount }, 'TemplateCountByMonthModelSuccessResp'),
  })
  getCountByMonth(
    @Query('months', ParseIntPipe) months: number,
    @Query('year') year: string,
    @Param('type') type: string,
  ) {
    return this.templateDataSource.getCountByMonth({ months, year }, type);
  }

  /**
   * Get template count by year
   */
  @Get('count/:type/by/year')
  @RamAuthorized(Actions.BaseTemplate.Counts)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Count by year',
    type: () => createResponseSuccessType({ data: TemplateYearCount }, 'TemplateCountByYearModelSuccessResp'),
  })
  getCountByYear(@Param('type') type: string) {
    return this.templateDataSource.getCountByYear(type);
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
    description: `return specific keys' metas if setted, otherwish no "metas" field return in "data".`,
  })
  @ApiOkResponse({
    description: 'Template model',
    type: () => createResponseSuccessType({ data: TemplateWithMetasModelResp }, 'TemplateModelSuccessResp'),
  })
  async get(
    @Param('id', ParseIntPipe) id: number,
    @Query('metaKeys', new ParseArrayPipe({ optional: true })) metaKeys: string[] | undefined,
    @User() requestUser: RequestUser,
  ) {
    const result = await this.templateDataSource.get(
      id,
      void 0,
      ['id', 'name', 'title', 'author', 'excerpt', 'content', 'status', 'type', 'createdAt'],
      requestUser,
    );

    if (result) {
      let metas;
      if (metaKeys?.length) {
        metas = await this.templateDataSource.getMetas(id, metaKeys, ['id', 'templateId', 'metaKey', 'metaValue']);
      }
      return this.success({
        data: {
          ...result,
          metas,
        },
      });
    }
    return this.success();
  }

  /**
   * Get paged template model
   */
  @Get()
  @RamAuthorized(Actions.BaseTemplate.PagedList)
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
      ['id', 'title', 'author', 'status', 'createdAt'],
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
  @RamAuthorized(Actions.BaseTemplate.Create)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    status: 201,
    description: 'Template model',
    type: () => createResponseSuccessType({ data: TemplateModelResp }, 'TemplateModelSuccessResp'),
  })
  async create(@Body() input: NewTemplateDto, @User() requestUser: RequestUser) {
    const { type, ...restDto } = input;
    const { id, title, author, excerpt, content, status, createdAt } = await this.templateDataSource.create(
      { ...restDto, excerpt: restDto.excerpt || '' },
      type,
      requestUser,
    );
    return this.success({
      data: {
        id,
        title,
        author,
        excerpt,
        content,
        status,
        createdAt,
      },
    });
  }

  /**
   * Update template
   */
  @Put(':id')
  @RamAuthorized(Actions.FormTemplate.Update)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}, 'UpdateTemplateModelSuccessResp'),
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() model: UpdateTemplateDto,
    @User() requestUser: RequestUser,
  ) {
    await this.templateDataSource.update(id, model, requestUser);
    return this.success();
  }

  /**
   * Update template name (must not be in "trash" status)
   */
  @Patch(':id/name')
  @RamAuthorized(Actions.BaseTemplate.UpdateName)
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
      return this.success({});
    } else {
      return this.faild(
        await i18n.tv('templates.controller.template_is_not_exists', `Template "${id}" does not exist！`, {
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
  @RamAuthorized(Actions.BaseTemplate.UpdateStatus)
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
      return this.success({});
    } else {
      return this.faild(
        await i18n.tv('templates.controller.template_is_not_exists', `Template "${id}" does not exist！`, {
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
  @RamAuthorized(Actions.BaseTemplate.BulkUpdateStatus)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({ data: Boolean }, 'BulkUpdateTemplateStatusModelSuccessResp'),
  })
  async bulkUpdateStatus(@Body() model: BulkUpdateTemplateStatusDto, @User() requestUser: RequestUser) {
    await this.templateDataSource.bulkUpdateStatus(model.templateIds, model.status, requestUser);
    return this.success({});
  }

  /**
   * Restore template (must be in "trash" status)
   */
  @Patch(':id/restore')
  @RamAuthorized(Actions.BaseTemplate.Restore)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}, 'RestoreTemplateModelSuccessResp'),
  })
  async restore(@Param('id', ParseIntPipe) id: number, @User() requestUser: RequestUser, @I18n() i18n: I18nContext) {
    const result = await this.templateDataSource.restore(id, requestUser);
    if (result) {
      return this.success({});
    } else {
      return this.faild(
        await i18n.tv('templates.controller.template_is_not_exists', `Template "${id}" does not exist！`, {
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
  @RamAuthorized(Actions.BaseTemplate.BulkRestore)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiBody({ type: () => [Number], description: 'Template ids' })
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}, 'BulkRestoreTemplateModelSuccessResp'),
  })
  async bulkRestore(@Body() ids: number[], @User() requestUser: RequestUser) {
    await this.templateDataSource.bulkRestore(ids, requestUser);
    return this.success({});
  }

  /**
   * Delete template permanently (must be in "trash" status)
   */
  @Delete(':id')
  @RamAuthorized(Actions.BaseTemplate.Delete)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}, 'DeleteTemplateModelSuccessResp'),
  })
  async delete(@Param('id', ParseIntPipe) id: number, @User() requestUser: RequestUser, @I18n() i18n: I18nContext) {
    const result = await this.templateDataSource.delete(id, requestUser);
    if (result) {
      return this.success({});
    } else {
      return this.faild(
        await i18n.tv('templates.controller.template_is_not_exists', `Template "${id}" does not exist！`, {
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
  @RamAuthorized(Actions.BaseTemplate.BulkDelete)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiBody({ type: () => [Number], description: 'Template ids' })
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}, 'BulkDeleteTemplateModelSuccessResp'),
  })
  async bulkDelete(@Body() ids: number[], @User() requestUser: RequestUser) {
    await this.templateDataSource.bulkDelete(ids, requestUser);
    return this.success({});
  }
}
