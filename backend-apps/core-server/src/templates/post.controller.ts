import { ApiTags, ApiQuery, ApiOkResponse } from '@nestjs/swagger';
import {
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
  HttpStatus,
} from '@nestjs/common';
import { Authorized, Anonymous, RamAuthorized } from 'nestjs-identity';
import { BaseController } from '@/common/controllers/base.controller';
import { ApiAuth } from '@/common/decorators/api-auth.decorator';
import { Actions } from '@/common/ram-actions';
import { User } from '@/common/decorators/user.decorator';
import { ParseQueryPipe } from '@/common/pipes/parse-query.pipe';
import { createResponseSuccessType } from '@/common/utils/swagger-type.util';
import { Taxonomy, TemplateType } from '@/orm-entities/interfaces';
import { TemplateDataSource } from '@/sequelize-datasources/datasources';
import { PagedTemplateArgs, TemplateOptionArgs } from '@/sequelize-datasources/interfaces';
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
  constructor(private readonly templateDataSource: TemplateDataSource) {
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
    const result = await this.templateDataSource.getOptions(
      {
        ...restQuery,
        taxonomies: [
          (categoryId !== void 0 || categoryName !== void 0) && {
            taxonomyType: Taxonomy.Category,
            taxonomyId: categoryId,
            taxonomyName: categoryName,
          },
          (tagId !== void 0 || tagName !== void 0) && {
            taxonomyType: Taxonomy.Tag,
            taxonomyId: tagId,
            taxonomyName: tagName,
          },
        ].filter(Boolean) as TemplateOptionArgs['taxonomies'],
      },
      TemplateType.Post,
      ['id', 'name', 'title'],
    );
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
    description: `return specific keys' metas if setted, otherwish no "metas" field return in "data".`,
  })
  @ApiOkResponse({
    description: 'Post template model',
    type: () => createResponseSuccessType({ data: PostTemplateModelResp }, 'PostTemplateModelSuccessResp'),
  })
  async getByName(
    @Param('name') name: string,
    @Query('metaKeys', new ParseArrayPipe({ optional: true })) metaKeys: string[] | undefined,
    @User() requestUser: RequestUser,
  ) {
    const result = await this.templateDataSource.getByName(
      name,
      TemplateType.Post,
      ['id', 'name', 'title', 'author', 'content', 'excerpt', 'status', 'createdAt'],
      requestUser,
    );

    if (result) {
      let metas;
      if (metaKeys?.length) {
        metas = await this.templateDataSource.getMetas(result.id, metaKeys, ['id', 'metaKey', 'metaValue']);
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
   * Get post template model by id
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
    description: 'Post template model',
    type: () => createResponseSuccessType({ data: PostTemplateWithMetasModelResp }, 'PostTemplateModelSuccessResp'),
  })
  async get(
    @Param('id', ParseIntPipe) id: number,
    @Query('metaKeys', new ParseArrayPipe({ optional: true })) metaKeys: string[] | undefined,
    @User() requestUser: RequestUser,
  ) {
    const result = await this.templateDataSource.get(
      id,
      TemplateType.Post,
      ['id', 'name', 'title', 'author', 'content', 'excerpt', 'status', 'createdAt'],
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
   * Get paged post template model
   */
  @Get()
  @RamAuthorized(Actions.PostTemplate.PagedList)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Paged posts template models',
    type: () => createResponseSuccessType({ data: PagedPostTemplateResp }, 'PagedPostTemplateSuccessResp'),
  })
  async getPaged(@Query(ParseQueryPipe) query: PagedPostTemplateQueryDto, @User() requestUser: RequestUser) {
    const { categoryId, categoryName, tagId, tagName, ...restQuery } = query;
    const result = await this.templateDataSource.getPaged(
      {
        ...restQuery,
        taxonomies: [
          (categoryId !== void 0 || categoryName !== void 0) && {
            taxonomyType: Taxonomy.Category,
            taxonomyId: categoryId,
            taxonomyName: categoryName,
          },
          (tagId !== void 0 || tagName !== void 0) && {
            taxonomyType: Taxonomy.Tag,
            taxonomyId: tagId,
            taxonomyName: tagName,
          },
        ].filter(Boolean) as PagedTemplateArgs['taxonomies'],
      },
      TemplateType.Post,
      ['id', 'name', 'title', 'author', 'excerpt', 'status', 'createdAt'],
      requestUser,
    );

    return this.success({
      data: result,
    });
  }

  /**
   * Create post template
   */
  @Post()
  @RamAuthorized(Actions.PostTemplate.Create)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    status: 201,
    description: 'Post template model',
    type: () => createResponseSuccessType({ data: PostTemplateModelResp }, 'PostTemplateModelSuccessResp'),
  })
  async create(@Body() input: NewPostTemplateDto, @User() requestUser: RequestUser) {
    const { id, name, title, author, content, excerpt, status, createdAt } = await this.templateDataSource.create(
      { ...input, excerpt: input.excerpt || '' },
      TemplateType.Post,
      requestUser,
    );
    return this.success({
      data: {
        id,
        name,
        title,
        author,
        content,
        excerpt,
        status,
        createdAt,
      },
    });
  }

  /**
   * Update post template
   */
  @Put(':id')
  @RamAuthorized(Actions.PostTemplate.Update)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}, 'UpdatePostTemplateModelSuccessResp'),
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() model: UpdatePostTemplateDto,
    @User() requestUser: RequestUser,
  ) {
    await this.templateDataSource.update(id, model, requestUser);
    return this.success();
  }

  /**
   * Delete post template permanently
   */
  // @Delete(':id')
  // @RamAuthorized(Actions.PostTemplate.Delete)
  // @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  // @ApiOkResponse({
  //   description: 'no data content',
  //   type: () => createResponseSuccessType({}, 'DeletePostTemplateModelSuccessResp'),
  // })
  // @ApiUnauthorizedResponse()
  // @ApiForbiddenResponse()
  // async delete(@Param('id', ParseIntPipe) id: number, @User() requestUser: RequestUser) {
  //   await this.templateDataSource.delete(id, requestUser);
  //   return this.success({});
  // }
}
