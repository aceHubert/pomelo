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
  OnModuleInit,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Authorized, Anonymous } from '@ace-pomelo/nestjs-authorization';
import { RamAuthorized } from '@ace-pomelo/nestjs-ram-authorization';
import {
  createResponseSuccessType,
  ParseQueryPipe,
  ValidatePayloadExistsPipe,
  ApiAuthCreate,
  User,
  RequestUser,
  TemplateStatus,
  TemplatePresetType,
  TermPresetTaxonomy,
  POMELO_SERVICE_PACKAGE_NAME,
} from '@ace-pomelo/shared/server';
import {
  TEMPLATE_SERVICE_NAME,
  TemplateServiceClient,
  GetTemplateOptionsRequest,
  GetPagedTemplateRequest,
} from '@ace-pomelo/shared/server/proto-ts/template';
import { PostTemplateAction } from '@/common/actions';
import { BaseController } from '@/common/controllers/base.controller';
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
export class PostTemplateController extends BaseController implements OnModuleInit {
  private templateServiceClient!: TemplateServiceClient;

  constructor(@Inject(POMELO_SERVICE_PACKAGE_NAME) private readonly client: ClientGrpc) {
    super();
  }

  onModuleInit() {
    this.templateServiceClient = this.client.getService<TemplateServiceClient>(TEMPLATE_SERVICE_NAME);
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
    const { options } = await this.templateServiceClient
      .getOptions({
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
        ].filter(Boolean) as GetTemplateOptionsRequest['taxonomies'],
        type: TemplatePresetType.Post,
        fields: ['id', 'name', 'title'],
      })
      .lastValue();

    return this.success({
      data: options,
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
    const { template } = await this.templateServiceClient
      .getByName({
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
    if (template) {
      ({ metas } = await this.templateServiceClient
        .getMetas({
          templateId: template.id,
          metaKeys: metaKeys || [],
          fields: ['id', 'metaKey', 'metaValue'],
        })
        .lastValue());
    }

    if (!template) {
      res.status(HttpStatus.NO_CONTENT);
    }

    return this.success({
      data: {
        ...template,
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
    const { template } = await this.templateServiceClient
      .get({
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
    if (template && metaKeys?.length) {
      ({ metas } = await this.templateServiceClient
        .getMetas({
          templateId: template.id,
          metaKeys,
          fields: ['id', 'metaKey', 'metaValue'],
        })
        .lastValue());
    }

    if (!template) {
      res.status(HttpStatus.NO_CONTENT);
    }

    return this.success({
      data: {
        ...template,
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
    const templates = await this.templateServiceClient
      .getPaged({
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
        ].filter(Boolean) as GetPagedTemplateRequest['taxonomies'],
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
      data: templates,
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
    const {
      template: {
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
    } = await this.templateServiceClient
      .createPost({
        ...input,
        excerpt: input.excerpt || '',
        metas: [],
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();

    if (status === TemplateStatus.Pending) {
      // TODO: send WS message to admin to review
    }

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
    @Body(ValidatePayloadExistsPipe) input: UpdatePostTemplateDto,
    @User() requestUser: RequestUser,
  ) {
    try {
      await this.templateServiceClient
        .update({
          ...input,
          id,
          requestUserId: Number(requestUser.sub),
        })
        .lastValue();

      if (input.status === TemplateStatus.Pending) {
        // TODO: send WS message to admin to review
      }

      return this.success();
    } catch (e: any) {
      this.logger.error(e);
      return this.faild(e.message);
    }
  }
}
