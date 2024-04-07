import { ModuleRef } from '@nestjs/core';
import { ApiTags, ApiBody, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { Controller, Scope, Param, Body, Get, Post, Put, Query, Delete, HttpStatus } from '@nestjs/common';
import {
  OptionDataSource,
  TermTaxonomyDataSource,
  TermPresetTaxonomy,
  OptionPresetKeys,
} from '@ace-pomelo/infrastructure-datasource';
import { Anonymous, Authorized } from '@ace-pomelo/nestjs-oidc';
import { RamAuthorized } from '@ace-pomelo/ram-authorization';
import {
  createResponseSuccessType,
  ParseQueryPipe,
  ValidatePayloadExistsPipe,
  ApiAuthCreate,
} from '@ace-pomelo/shared-server';
import { createMetaController } from '@/common/controllers/meta.controller';
import { TermTaxonomyAction } from '@/common/actions';
import { NewTermTaxonomyMetaDto } from './dto/new-term-taxonomy-meta.dto';
import { NewTermTaxonomyDto } from './dto/new-term-taxonomy.dto';
import { UpdateTermTaxonomyDto } from './dto/update-term-taxonomy.dto';
import {
  TermTaxonomyQueryDto,
  CategoryTermTaxonomyQueryDto,
  TagTermTaxonomyQueryDto,
} from './dto/term-taxonomy-query.dto';
import {
  TermTaxonomyModelResp,
  TermTaxonomyMetaModelResp,
  TermRelationshipModelResp,
} from './resp/term-taxonomy-model.resp';

@ApiTags('term-taxonomy')
@Authorized()
@Controller({ path: 'api/taxonoies', scope: Scope.REQUEST })
export class TermTaxonomyController extends createMetaController(
  'termTaxonomy',
  TermTaxonomyMetaModelResp,
  NewTermTaxonomyMetaDto,
  TermTaxonomyDataSource,
  {
    authDecorator: (method) => {
      const ramAction =
        method === 'getMeta'
          ? TermTaxonomyAction.MetaDetail
          : method === 'getMetas'
          ? TermTaxonomyAction.MetaList
          : method === 'createMeta' || method === 'createMetas'
          ? TermTaxonomyAction.MetaCreate
          : method === 'updateMeta' || method === 'updateMetaByKey'
          ? TermTaxonomyAction.MetaUpdate
          : TermTaxonomyAction.MetaDelete;

      return method === 'getMeta' || method === 'getMetas'
        ? [RamAuthorized(ramAction), Anonymous()]
        : [RamAuthorized(ramAction), ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])];
    },
  },
) {
  constructor(
    protected readonly moduleRef: ModuleRef,
    private readonly termTaxonomyDataSource: TermTaxonomyDataSource,
    private readonly optionDataSource: OptionDataSource,
  ) {
    super(moduleRef);
  }

  /**
   * Get category taxonomy list
   */
  @Get('categories')
  @RamAuthorized(TermTaxonomyAction.CategoryList)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Term taxonomy models',
    type: () => createResponseSuccessType({ data: [TermTaxonomyModelResp] }),
  })
  async getCategoryList(@Query(ParseQueryPipe) query: CategoryTermTaxonomyQueryDto) {
    let excludes: number[] | undefined;
    if (query.includeDefault !== true) {
      const defaultCategoryId = await this.optionDataSource.getOptionValue(OptionPresetKeys.DefaultCategory);
      excludes = [Number(defaultCategoryId)];
    }
    const result = await this.termTaxonomyDataSource.getList(
      { ...query, excludes, taxonomy: TermPresetTaxonomy.Category },
      ['id', 'name', 'slug', 'description', 'parentId', 'group', 'count'],
    );
    return this.success({
      data: result,
    });
  }

  /**
   * Get tag taxonomy list
   */
  @Get('tags')
  @RamAuthorized(TermTaxonomyAction.TagList)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Term taxonomy models',
    type: () => createResponseSuccessType({ data: [TermTaxonomyModelResp] }),
  })
  async getTagList(@Query(ParseQueryPipe) query: TagTermTaxonomyQueryDto) {
    const result = await this.termTaxonomyDataSource.getList({ ...query, taxonomy: TermPresetTaxonomy.Tag }, [
      'id',
      'name',
      'slug',
      'description',
      'parentId',
      'group',
      'count',
    ]);
    return this.success({
      data: result,
    });
  }

  /**
   * Get term taxonomy list
   */
  @Get()
  @RamAuthorized(TermTaxonomyAction.List)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Term taxonomy models',
    type: () => createResponseSuccessType({ data: [TermTaxonomyModelResp] }),
  })
  async getList(@Query(ParseQueryPipe) query: TermTaxonomyQueryDto) {
    const result = await this.termTaxonomyDataSource.getList(query, [
      'id',
      'name',
      'slug',
      'taxonomy',
      'description',
      'parentId',
      'group',
      'count',
    ]);
    return this.success({
      data: result,
    });
  }

  /**
   * Get term taxonomy by id
   */
  @Get(':id')
  @Anonymous()
  @ApiOkResponse({
    description: 'Term taxonomy model',
    type: () => createResponseSuccessType({ data: TermTaxonomyModelResp }),
  })
  async get(@Param('id') id: number) {
    const result = await this.termTaxonomyDataSource.get(id, [
      'id',
      'name',
      'slug',
      'taxonomy',
      'description',
      'parentId',
      'group',
      'count',
    ]);
    return this.success({
      data: result,
    });
  }

  /**
   * Create term taxonomy
   */
  @Post()
  @RamAuthorized(TermTaxonomyAction.Create)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiCreatedResponse({
    description: 'Term taxonomy model',
    type: () => createResponseSuccessType({ data: TermTaxonomyModelResp }),
  })
  async create(@Body() input: NewTermTaxonomyDto) {
    const result = await this.termTaxonomyDataSource.create(input);
    return this.success({
      data: result,
    });
  }

  /**
   * Create relationship between term taxonomy and object(Form, Page, etc...)
   */
  @Post(':id/objects/:objectId')
  @RamAuthorized(TermTaxonomyAction.CreateRelationship)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiCreatedResponse({
    description: 'Term taxonomy relationship model',
    type: () => createResponseSuccessType({ data: TermRelationshipModelResp }),
  })
  async createRelationship(@Param('id') termTaxonomyId: number, @Param('objectId') objectId: number) {
    const result = await this.termTaxonomyDataSource.createRelationship({ termTaxonomyId, objectId });
    return this.success({
      data: result,
    });
  }

  /**
   * Update term taxonomy by id
   */
  @Put(':id')
  @RamAuthorized(TermTaxonomyAction.Update)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: '"true" if success',
    type: () => createResponseSuccessType({}),
  })
  async update(@Param('id') id: number, @Body(ValidatePayloadExistsPipe) input: UpdateTermTaxonomyDto) {
    try {
      await this.termTaxonomyDataSource.update(id, input);
      return this.success();
    } catch (e: any) {
      this.logger.error(e);
      return this.faild(e.message);
    }
  }

  /**
   * Delete term taxonomy by id
   */
  @Delete(':id')
  @RamAuthorized(TermTaxonomyAction.Delete)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}),
  })
  async delete(@Param('id') id: number) {
    try {
      await this.termTaxonomyDataSource.delete(id);
      return this.success();
    } catch (e: any) {
      this.logger.error(e);
      return this.faild(e.message);
    }
  }

  /**
   * Delete bulk of term taxonomies
   */
  @Delete('/bulk')
  @RamAuthorized(TermTaxonomyAction.BulkDelete)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiBody({ type: () => [Number], description: 'term taxonomy ids' })
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}),
  })
  async bulkDelete(@Body() ids: number[]) {
    try {
      await this.termTaxonomyDataSource.bulkDelete(ids);
      return this.success();
    } catch (e: any) {
      this.logger.error(e);
      return this.faild(e.message);
    }
  }

  /**
   * Delete relationship between term taxonomy and object(Form, Page, etc...)
   */
  @Delete(':id/objects/:objectId')
  @RamAuthorized(TermTaxonomyAction.DeleteRelationship)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}),
  })
  async deleteRelationship(@Param('id') termTaxonomyId: number, @Param('objectId') objectId: number) {
    try {
      await this.termTaxonomyDataSource.deleteRelationship(objectId, termTaxonomyId);
      return this.success();
    } catch (e: any) {
      this.logger.error(e);
      return this.faild(e.message);
    }
  }
}
