import { ApiTags, ApiBody, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import {
  Inject,
  Controller,
  Scope,
  Param,
  Body,
  Get,
  Post,
  Put,
  Query,
  Delete,
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Anonymous, Authorized } from '@ace-pomelo/authorization';
import { RamAuthorized } from '@ace-pomelo/ram-authorization';
import {
  createResponseSuccessType,
  ParseQueryPipe,
  ValidatePayloadExistsPipe,
  ApiAuthCreate,
  TermPresetTaxonomy,
  OptionPresetKeys,
  INFRASTRUCTURE_SERVICE,
  OptionPattern,
  TermTaxonomyPattern,
} from '@ace-pomelo/shared/server';
import { TermTaxonomyAction } from '@/common/actions';
import { createMetaController } from '@/common/controllers/meta.controller';
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
  constructor(@Inject(INFRASTRUCTURE_SERVICE) protected readonly basicService: ClientProxy) {
    super(basicService);
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
      const defaultCategoryId = await this.basicService
        .send<string>(OptionPattern.GetValue, {
          optionName: OptionPresetKeys.DefaultCategory,
        })
        .lastValue();
      excludes = [Number(defaultCategoryId)];
    }
    const result = await this.basicService
      .send<TermTaxonomyModelResp[]>(TermTaxonomyPattern.GetList, {
        query: { ...query, excludes, taxonomy: TermPresetTaxonomy.Category },
        fields: ['id', 'name', 'slug', 'description', 'parentId', 'group', 'count'],
      })
      .lastValue();

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
    const result = await this.basicService
      .send<TermTaxonomyModelResp[]>(TermTaxonomyPattern.GetList, {
        query: { ...query, taxonomy: TermPresetTaxonomy.Tag },
        fields: ['id', 'name', 'slug', 'description', 'parentId', 'group', 'count'],
      })
      .lastValue();
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
    const result = await this.basicService
      .send<TermTaxonomyModelResp[]>(TermTaxonomyPattern.GetList, {
        query,
        fields: ['id', 'name', 'slug', 'taxonomy', 'description', 'parentId', 'group', 'count'],
      })
      .lastValue();

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
    const result = await this.basicService
      .send<TermTaxonomyModelResp | undefined>(TermTaxonomyPattern.Get, {
        id,
        fields: ['id', 'name', 'slug', 'taxonomy', 'description', 'parentId', 'group', 'count'],
      })
      .lastValue();

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
    const result = await this.basicService.send<TermTaxonomyModelResp>(TermTaxonomyPattern.Create, input).lastValue();

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
    const result = await this.basicService
      .send<TermRelationshipModelResp>(TermTaxonomyPattern.CreateRelationship, { termTaxonomyId, objectId })
      .lastValue();

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
  async update(@Param('id', ParseIntPipe) id: number, @Body(ValidatePayloadExistsPipe) input: UpdateTermTaxonomyDto) {
    try {
      await this.basicService.send<void>(TermTaxonomyPattern.Update, { id, ...input }).lastValue();
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
      await this.basicService.send(TermTaxonomyPattern.Delete, { id }).lastValue();
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
      await this.basicService.send<void>(TermTaxonomyPattern.BulkDelete, { ids }).lastValue();
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
      await this.basicService
        .send<void>(TermTaxonomyPattern.DeleteRelationship, {
          objectId,
          termTaxonomyId,
        })
        .lastValue();
      return this.success();
    } catch (e: any) {
      this.logger.error(e);
      return this.faild(e.message);
    }
  }
}
