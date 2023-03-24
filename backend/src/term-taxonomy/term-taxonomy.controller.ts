import { ModuleRef } from '@nestjs/core';
import { ApiTags, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { Controller, Scope, Param, Body, Get, Post, Put, Query, Delete, HttpStatus } from '@nestjs/common';
import { createMetaController } from '@/common/controllers/meta.controller';
import { ApiAuth } from '@/common/decorators/api-auth.decorator';
import { Anonymous, Authorized } from '@/common/decorators/authorized.decorator';
import { RamAuthorized, Actions } from '@/common/decorators/ram-authorized.decorator';
import { User } from '@/common/decorators/user.decorator';
import { ParseQueryPipe } from '@/common/pipes/parse-query.pipe';
import { createResponseSuccessType } from '@/common/utils/swagger-type.util';
import { TermTaxonomyDataSource } from '@/sequelize-datasources/datasources';
import { Taxonomy } from '@/orm-entities/interfaces';

// Types
import { NewTermTaxonomyDto } from './dto/new-term-taxonomy.dto';
import { NewTermTaxonomyMetaDto } from './dto/new-term-taxonomy-meta.dto';
import { UpdateTermTaxonomyDto } from './dto/update-term-taxonomy.dto';
import {
  TermTaxonomyQueryDto,
  CategoryTermTaxonomyQueryDto,
  TagTermTaxonomyQueryDto,
} from './dto/term-taxonomy-query.dto';
import { TermTaxonomyModelResp, TermTaxonomyMetaModelResp } from './resp/term-taxonomy-model.resp';
import { NewTermRelationshipResp } from './resp/new-term-relationship.resp';

@ApiTags('term-taxonomy')
@Authorized()
@Controller({ path: 'api/taxonoies', scope: Scope.REQUEST })
export class TermTaxonomyController extends createMetaController(
  'termTaxonomy',
  TermTaxonomyMetaModelResp,
  NewTermTaxonomyMetaDto,
  TermTaxonomyDataSource,
  {
    authDecorator: ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN]),
  },
) {
  constructor(
    protected readonly moduleRef: ModuleRef,
    private readonly termTaxonomyDataSource: TermTaxonomyDataSource,
  ) {
    super(moduleRef);
  }

  /**
   * Get category taxonomy list
   */
  @Get('categories')
  @RamAuthorized(Actions.TermTaxonomy.CategoryList)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Term taxonomy models',
    type: () => createResponseSuccessType({ data: [TermTaxonomyModelResp] }),
  })
  async getCategoryList(@Query(ParseQueryPipe) query: CategoryTermTaxonomyQueryDto) {
    const result = await this.termTaxonomyDataSource.getList({ ...query, taxonomy: Taxonomy.Category }, [
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
   * Get tag taxonomy list
   */
  @Get('tags')
  @RamAuthorized(Actions.TermTaxonomy.TagList)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Term taxonomy models',
    type: () => createResponseSuccessType({ data: [TermTaxonomyModelResp] }),
  })
  async getTagList(@Query(ParseQueryPipe) query: TagTermTaxonomyQueryDto) {
    const result = await this.termTaxonomyDataSource.getList({ ...query, taxonomy: Taxonomy.Tag }, [
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
  @RamAuthorized(Actions.TermTaxonomy.List)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
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
  @RamAuthorized(Actions.TermTaxonomy.Create)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    status: 201,
    description: 'Term taxonomy model',
    type: () => createResponseSuccessType({ data: TermTaxonomyModelResp }),
  })
  async create(@Body() input: NewTermTaxonomyDto, @User() requestUser: RequestUser) {
    const result = await this.termTaxonomyDataSource.create(input, requestUser);
    return this.success({
      data: result,
    });
  }

  /**
   * Create relationship between term taxonomy and object(Form, Page, etc...)
   */
  @Post(':id/objects/:objectId')
  @RamAuthorized(Actions.TermTaxonomy.CreateRelationship)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Term taxonomy relationship model',
    type: () => createResponseSuccessType({ data: NewTermRelationshipResp }),
  })
  async createRelationship(
    @Param('id') termTaxonomyId: number,
    @Param('objectId') objectId: number,
    @User() requestUser: RequestUser,
  ) {
    const result = await this.termTaxonomyDataSource.createRelationship({ termTaxonomyId, objectId }, requestUser);
    return this.success({
      data: result,
    });
  }

  /**
   * Update term taxonomy by id
   */
  @Put(':id')
  @RamAuthorized(Actions.TermTaxonomy.Update)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: '"true" if success',
    type: () => createResponseSuccessType({}),
  })
  async update(@Param('id') id: number, @Body() input: UpdateTermTaxonomyDto) {
    await this.termTaxonomyDataSource.update(id, input);
    return this.success({});
  }

  /**
   * Delete term taxonomy by id
   */
  @Delete(':id')
  @RamAuthorized(Actions.TermTaxonomy.Delete)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}),
  })
  async delete(@Param('id') id: number) {
    await this.termTaxonomyDataSource.delete(id);
    return this.success({});
  }

  /**
   * Delete bulk of term taxonomies
   */
  @Delete('/bulk')
  @RamAuthorized(Actions.TermTaxonomy.BulkDelete)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiBody({ type: () => [Number], description: 'term taxonomy ids' })
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}),
  })
  async bulkDelete(@Body() ids: number[]) {
    await this.termTaxonomyDataSource.bulkDelete(ids);
    return this.success({});
  }

  /**
   * Delete relationship between term taxonomy and object(Form, Page, etc...)
   */
  @Delete(':id/objects/:objectId')
  @RamAuthorized(Actions.TermTaxonomy.DeleteRelationship)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}),
  })
  async deleteRelationship(@Param('id') termTaxonomyId: number, @Param('objectId') objectId: number) {
    await this.termTaxonomyDataSource.deleteRelationship(objectId, termTaxonomyId);
    return this.success({});
  }
}
