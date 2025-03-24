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
  OnModuleInit,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Anonymous, Authorized } from '@ace-pomelo/nestjs-authorization';
import { RamAuthorized } from '@ace-pomelo/nestjs-ram-authorization';
import {
  createResponseSuccessType,
  ParseQueryPipe,
  ValidatePayloadExistsPipe,
  ApiAuthCreate,
  TermPresetTaxonomy,
  OptionPresetKeys,
  POMELO_SERVICE_PACKAGE_NAME,
} from '@ace-pomelo/shared/server';
import {
  TermTaxonomyServiceClient,
  TERM_TAXONOMY_SERVICE_NAME,
} from '@ace-pomelo/shared/server/proto-ts/term-taxonomy';
import { OptionServiceClient, OPTION_SERVICE_NAME } from '@ace-pomelo/shared/server/proto-ts/option';
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
export class TermTaxonomyController
  extends createMetaController('termTaxonomy', TermTaxonomyMetaModelResp, NewTermTaxonomyMetaDto, {
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
  })
  implements OnModuleInit
{
  private termTaxonomyServiceClient!: TermTaxonomyServiceClient;
  private optionServiceClient!: OptionServiceClient;

  constructor(@Inject(POMELO_SERVICE_PACKAGE_NAME) private readonly client: ClientGrpc) {
    super();
  }

  onModuleInit() {
    this.termTaxonomyServiceClient = this.client.getService<TermTaxonomyServiceClient>(TERM_TAXONOMY_SERVICE_NAME);
    this.optionServiceClient = this.client.getService<OptionServiceClient>(OPTION_SERVICE_NAME);
  }

  get metaServiceClient() {
    return this.termTaxonomyServiceClient;
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
    let excludes: number[] = [];
    if (query.includeDefault !== true) {
      const { optionValue: defaultCategoryId } = await this.optionServiceClient
        .getValue({
          optionName: OptionPresetKeys.DefaultCategory,
        })
        .lastValue();
      excludes = [Number(defaultCategoryId)];
    }
    const { termTaxonomies } = await this.termTaxonomyServiceClient
      .getList({
        ...query,
        excludes,
        taxonomy: TermPresetTaxonomy.Category,
        fields: ['id', 'name', 'slug', 'description', 'parentId', 'group', 'count'],
      })
      .lastValue();

    return this.success({
      data: termTaxonomies,
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
    const { termTaxonomies } = await this.termTaxonomyServiceClient
      .getList({
        ...query,
        excludes: [],
        taxonomy: TermPresetTaxonomy.Tag,
        fields: ['id', 'name', 'slug', 'description', 'parentId', 'group', 'count'],
      })
      .lastValue();
    return this.success({
      data: termTaxonomies,
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
    const { termTaxonomies } = await this.termTaxonomyServiceClient
      .getList({
        ...query,
        excludes: query.exclude || [],
        fields: ['id', 'name', 'slug', 'taxonomy', 'description', 'parentId', 'group', 'count'],
      })
      .lastValue();

    return this.success({
      data: termTaxonomies,
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
  async get(@Param('id', ParseIntPipe) id: number) {
    const { termTaxonomy } = await this.termTaxonomyServiceClient
      .get({
        id,
        fields: ['id', 'name', 'slug', 'taxonomy', 'description', 'parentId', 'group', 'count'],
      })
      .lastValue();

    return this.success({
      data: termTaxonomy,
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
    const { termTaxonomy } = await this.termTaxonomyServiceClient.create(input).lastValue();

    return this.success({
      data: termTaxonomy,
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
  async createRelationship(@Param('id', ParseIntPipe) termTaxonomyId: number, @Param('objectId') objectId: number) {
    const { relationship } = await this.termTaxonomyServiceClient
      .createRelationship({ termTaxonomyId, objectId })
      .lastValue();

    return this.success({
      data: relationship,
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
      await this.termTaxonomyServiceClient.update({ id, ...input }).lastValue();
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
  async delete(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.termTaxonomyServiceClient.delete({ id }).lastValue();
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
      await this.termTaxonomyServiceClient.bulkDelete({ ids }).lastValue();
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
  async deleteRelationship(@Param('id', ParseIntPipe) termTaxonomyId: number, @Param('objectId') objectId: number) {
    try {
      await this.termTaxonomyServiceClient
        .deleteRelationship({
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
