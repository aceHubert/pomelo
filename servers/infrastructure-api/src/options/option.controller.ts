import { Response } from 'express';
import { ApiTags, ApiOkResponse, ApiCreatedResponse, ApiNoContentResponse } from '@nestjs/swagger';
import { Controller, Query, Param, Body, Get, Post, Put, Delete, ParseIntPipe, Res, HttpStatus } from '@nestjs/common';
import { OptionDataSource } from '@ace-pomelo/infrastructure-datasource';
import { Authorized, Anonymous } from '@ace-pomelo/nestjs-oidc';
import { RamAuthorized } from '@ace-pomelo/ram-authorization';
import {
  describeType,
  createResponseSuccessType,
  User,
  ApiAuthCreate,
  ParseQueryPipe,
  ValidatePayloadExistsPipe,
  RequestUser,
} from '@ace-pomelo/shared-server';
import { OptionAction } from '@/common/actions';
import { BaseController } from '@/common/controllers/base.controller';
import { OptionQueryDto } from './dto/option-query.dto';
import { NewOptionDto } from './dto/new-option.dto';
import { UpdateOptionDto } from './dto/update-option.dto';
import { OptionResp } from './resp/option.resp';

@ApiTags('options')
@Authorized()
@Controller('api/options')
export class OptionController extends BaseController {
  constructor(private readonly optionDataSource: OptionDataSource) {
    super();
  }

  /**
   * Get autoload options.
   */
  @Get('autoload')
  @Anonymous()
  @ApiOkResponse({
    description: 'Option values(key/value)',
    type: () => createResponseSuccessType({ data: {} }, 'AutoloadOptionsModelsSuccessResp'),
  })
  async getAutoloadOptions() {
    const result = await this.optionDataSource.getAutoloads();
    return this.success({
      data: result,
    });
  }

  /**
   * Get option.
   */
  @Get(':id')
  @Anonymous()
  @ApiOkResponse({
    description: 'Option model',
    type: () => createResponseSuccessType({ data: OptionResp }, 'OptionModelSuccessResp'),
  })
  @ApiNoContentResponse({ description: 'Option not found' })
  async get(@Param('id', ParseIntPipe) id: number, @Res({ passthrough: true }) res: Response) {
    const result = await this.optionDataSource.get(id, ['id', 'optionName', 'optionValue', 'autoload']);
    if (result === undefined) {
      res.status(HttpStatus.NO_CONTENT);
    }
    return this.success({
      data: result,
    });
  }

  /**
   * Get option value by name.
   */
  @Get(':name/value')
  @Anonymous()
  @ApiOkResponse({
    description: 'Option value',
    type: () =>
      createResponseSuccessType(
        { data: describeType(String, { nullable: true, description: 'Option value' }) },
        'OptionValueSuccessResp',
      ),
  })
  @ApiNoContentResponse({ description: 'Option not found' })
  async getValue(@Param('name') name: string, @Res({ passthrough: true }) res: Response) {
    const value = await this.optionDataSource.getValue(name);
    if (value === undefined) {
      res.status(HttpStatus.NO_CONTENT);
    }
    return this.success({
      data: value,
    });
  }

  /**
   * Get options.
   */
  @Get()
  @RamAuthorized(OptionAction.List)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Option models',
    type: () => createResponseSuccessType({ data: [OptionResp] }, 'OptionModelsSuccessResp'),
  })
  async getList(@Query(ParseQueryPipe) query: OptionQueryDto) {
    const result = await this.optionDataSource.getList(query, ['id', 'optionName', 'optionValue', 'autoload']);
    return this.success({
      data: result,
    });
  }

  /**
   * Create a new option.
   */
  @Post()
  @RamAuthorized(OptionAction.Create)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiCreatedResponse({
    description: 'Option model',
    type: () => createResponseSuccessType({ data: OptionResp }, 'OptionModelSuccessResp'),
  })
  async create(@Body() input: NewOptionDto, @User() requestUser: RequestUser) {
    const result = await this.optionDataSource.create(input, Number(requestUser.sub));
    return this.success({
      data: result,
    });
  }

  /**
   * Clear option cache from momery.
   */
  @Post('/cache/clear')
  @RamAuthorized(OptionAction.Update)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}, 'ClearOptionCacheModelSuccessResp'),
  })
  clearCache() {
    this.optionDataSource.reset();
    return this.success();
  }

  /**
   * Update option.
   */
  @Put(':id')
  @RamAuthorized(OptionAction.Update)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}, 'UpdateOptionModelSuccessResp'),
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidatePayloadExistsPipe) model: UpdateOptionDto,
    @User() requestUser: RequestUser,
  ) {
    try {
      await this.optionDataSource.update(id, model, Number(requestUser.sub));
      return this.success();
    } catch (e: any) {
      this.logger.error(e);
      return this.faild(e.message);
    }
  }

  /**
   * Delete option permanently.
   */
  @Delete(':id')
  @RamAuthorized(OptionAction.Delete)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Option model',
    type: () => createResponseSuccessType({}, 'DeleteOptionModelSuccessResp'),
  })
  async delete(@Param('id', ParseIntPipe) id: number, @User() requestUser: RequestUser) {
    try {
      await this.optionDataSource.delete(id, Number(requestUser.sub));
      return this.success();
    } catch (e: any) {
      this.logger.error(e);
      return this.faild(e.message);
    }
  }
}
