import { Response } from 'express';
import { ApiTags, ApiQuery, ApiOkResponse, ApiCreatedResponse, ApiNoContentResponse } from '@nestjs/swagger';
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
  ParseQueryPipe,
  ValidatePayloadExistsPipe,
  ApiAuthCreate,
  User,
  RequestUser,
  TemplatePresetType,
  TermPresetTaxonomy,
  INFRASTRUCTURE_SERVICE,
  TemplatePattern,
} from '@ace-pomelo/shared/server';
import { Authorized, Anonymous } from '@ace-pomelo/authorization';
import { RamAuthorized } from '@ace-pomelo/ram-authorization';
import { PostTemplateAction } from '@/common/actions';
import { BaseController } from '@/common/controllers/base.controller';
import { MetaModelResp } from '@/common/controllers/resp/meta-model.resp';
import { PostTemplateOptionQueryDto, PagedPostTemplateQueryDto } from './dto/template-query.dto';
import { NewPostTemplateDto } from './dto/new-template.dto';
import { UpdatePostTemplateDto } from './dto/update-template.dto';
import {
  PostTemplateModelResp,
  PostTemplateWithMetasModelResp,
  PagedPostTemplateResp,
  PostTemplateOptionResp,
} from './resp/post-model.resp';

/**
 * 表单 Restful Api 控制器
 */
@ApiTags('templates/post')
@Authorized()
@Controller({ path: 'api/template/posts', scope: Scope.REQUEST })
export class PostTemplateController extends BaseController {
  constructor(@Inject(INFRASTRUCTURE_SERVICE) protected readonly basicService: ClientProxy) {
    super();
  }

  /**
   *  Get post template options
   */
  @Get('options')
  @Anonymous()
  @ApiOkResponse({
    description: 'Post template options',
    type: () => createResponseSuccessType({ data: [PostTemplateOptionResp] }, 'PostTemplateOptionModelsSuccessResp'),
  })
  async getOptions(@Query(ParseQueryPipe) query: PostTemplateOptionQueryDto) {
    const { categoryId, categoryName, tagId, tagName, ...restQuery } = query;
    const result = await this.basicService
      .send<PostTemplateOptionResp[]>(TemplatePattern.GetOptions, {
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
            tagId !== void 0
              ? {
                  type: TermPresetTaxonomy.Tag,
                  id: tagId,
                }
              : tagName !== void 0
              ? {
                  type: TermPresetTaxonomy.Tag,
                  name: tagName,
                }
              : false,
          ].filter(Boolean),
        },
        type: TemplatePresetType.Post,
        fields: ['id', 'name', 'title'],
      })
      .lastValue();
    return this.success({
      data: result,
    });
  }

  /**
   * Get post template model by alias name
   */
  @Get(':name/alias')
  @Anonymous()
  @ApiQuery({
    name: 'metaKeys',
    type: [String],
    required: false,
    example: ['mobile', 'desktop'],
    description: `return specific keys' metas if setted, otherwish all "metas" field return in "data".`,
  })
  @ApiOkResponse({
    description: 'Post template model',
    type: () => createResponseSuccessType({ data: PostTemplateModelResp }, 'PostTemplateModelSuccessResp'),
  })
  @ApiNoContentResponse({ description: 'Post template not found' })
  async getByName(
    @Param('name') name: string,
    @Query('metaKeys', new ParseArrayPipe({ optional: true })) metaKeys: string[] | undefined,
    @Res({ passthrough: true }) res: Response,
    @User() requestUser?: RequestUser,
  ) {
    const result = await this.basicService
      .send<PostTemplateModelResp | undefined>(TemplatePattern.GetByName, {
        name,
        type: TemplatePresetType.Post,
        fields: [
          'id',
          'name',
          'title',
          'author',
          'content',
          'excerpt',
          'status',
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
   * Get post template model by id
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
    description: 'Post template model',
    type: () => createResponseSuccessType({ data: PostTemplateWithMetasModelResp }, 'PostTemplateModelSuccessResp'),
  })
  @ApiNoContentResponse({ description: 'Post template not found' })
  async get(
    @Param('id', ParseIntPipe) id: number,
    @Query('metaKeys', new ParseArrayPipe({ optional: true })) metaKeys: string[] | undefined,
    @Res({ passthrough: true }) res: Response,
    @User() requestUser?: RequestUser,
  ) {
    const result = await this.basicService
      .send<PostTemplateModelResp | undefined>(TemplatePattern.Get, {
        id,
        type: TemplatePresetType.Post,
        fields: [
          'id',
          'name',
          'title',
          'author',
          'content',
          'excerpt',
          'status',
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
   * Get published post templates
   */
  @Get('published')
  @ApiOkResponse({
    description: 'Paged posts template models',
    type: () => createResponseSuccessType({ data: PagedPostTemplateResp }, 'PagedPostTemplateSuccessResp'),
  })
  async getPublishedPaged(@Query(ParseQueryPipe) query: Omit<PagedPostTemplateQueryDto, 'status'>) {
    return this.getPaged(query);
  }

  /**
   * Get paged post templates
   */
  @Get()
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Paged posts template models',
    type: () => createResponseSuccessType({ data: PagedPostTemplateResp }, 'PagedPostTemplateSuccessResp'),
  })
  async getPaged(@Query(ParseQueryPipe) query: PagedPostTemplateQueryDto, @User() requestUser?: RequestUser) {
    const { categoryId, categoryName, tagId, tagName, ...restQuery } = query;
    const result = await this.basicService
      .send<PagedPostTemplateResp>(TemplatePattern.GetPaged, {
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
            tagId !== void 0
              ? {
                  type: TermPresetTaxonomy.Tag,
                  id: tagId,
                }
              : tagName !== void 0
              ? {
                  type: TermPresetTaxonomy.Tag,
                  name: tagName,
                }
              : false,
          ].filter(Boolean),
        },
        type: TemplatePresetType.Post,
        fields: [
          'id',
          'name',
          'title',
          'author',
          'excerpt',
          'status',
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
   * Create post template
   */
  @Post()
  @RamAuthorized(PostTemplateAction.Create)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiCreatedResponse({
    description: 'Post template model',
    type: () => createResponseSuccessType({ data: PostTemplateModelResp }, 'PostTemplateModelSuccessResp'),
  })
  async create(@Body() input: NewPostTemplateDto, @User() requestUser: RequestUser) {
    const { id, name, title, author, content, excerpt, status, commentStatus, commentCount, updatedAt, createdAt } =
      await this.basicService
        .send<PostTemplateModelResp>(TemplatePattern.CreatePost, {
          ...input,
          excerpt: input.excerpt || '',
          requestUserId: Number(requestUser.sub),
        })
        .lastValue();

    return this.success({
      data: {
        id,
        name,
        title,
        author,
        content,
        excerpt,
        status,
        commentStatus,
        commentCount,
        updatedAt,
        createdAt,
      },
    });
  }

  /**
   * Update post template
   */
  @Put(':id')
  @RamAuthorized(PostTemplateAction.Update)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}, 'UpdatePostTemplateModelSuccessResp'),
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidatePayloadExistsPipe) model: UpdatePostTemplateDto,
    @User() requestUser: RequestUser,
  ) {
    try {
      await this.basicService
        .send<void>(TemplatePattern.Update, {
          ...model,
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
   * Delete post template permanently
   */
  // @Delete(':id')
  // @RamAuthorized(PostTemplateAction.Delete)
  // @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  // @ApiOkResponse({
  //   description: 'no data content',
  //   type: () => createResponseSuccessType({}, 'DeletePostTemplateModelSuccessResp'),
  // })
  // @ApiUnauthorizedResponse()
  // @ApiForbiddenResponse()
  // async delete(@Param('id', ParseIntPipe) id: number, @User() requestUser: RequestUser) {
  //   await this.templateDataSource.delete(id, requestUser);
  //   return this.success();
  // }
}
