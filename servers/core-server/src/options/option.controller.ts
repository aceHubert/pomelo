import { Response } from 'express';
import { ApiTags, ApiOkResponse, ApiCreatedResponse, ApiNoContentResponse } from '@nestjs/swagger';
import { Controller, Query, Param, Body, Get, Post, Put, Delete, ParseIntPipe, Res, HttpStatus } from '@nestjs/common';
import { OptionDataSource } from '@pomelo/datasource';
import { RamAuthorized } from '@pomelo/ram-authorization';
import { I18n, I18nContext } from 'nestjs-i18n';
import { Authorized } from '@pomelo/authorization';
import {
  BaseController,
  User,
  ApiAuth,
  ParseQueryPipe,
  ValidatePayloadExistsPipe,
  describeType,
  createResponseSuccessType,
  RequestUser,
} from '@pomelo/shared-server';
import { OptionAction } from '@/common/actions';
import { OptionQueryDto } from './dto/option-query.dto';
import { NewOptionDto } from './dto/new-option.dto';
import { UpdateOptionDto } from './dto/update-option.dto';
import { OptionResp } from './resp/option.resp';

@ApiTags('options')
@Controller('api/options')
export class OptionController extends BaseController {
  constructor(private readonly optionDataSource: OptionDataSource) {
    super();
  }

  /**
   * Get autoload options.
   */
  @Get('autoload')
  @ApiOkResponse({
    description: 'Option values(key/value)',
    type: () => createResponseSuccessType({ data: {} }, 'AutoloadOptionsModelsSuccessResp'),
  })
  async getAutoloadOptions() {
    const result = await this.optionDataSource.getAutoloadOptions();
    return this.success({
      data: result,
    });
  }

  /**
   * Get option.
   */
  @Get(':id')
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
    const value = await this.optionDataSource.getOptionValue(name);
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
  @Authorized()
  @RamAuthorized(OptionAction.List)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
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
  @Authorized()
  @RamAuthorized(OptionAction.Create)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiCreatedResponse({
    description: 'Option model',
    type: () => createResponseSuccessType({ data: OptionResp }, 'OptionModelSuccessResp'),
  })
  async create(@Body() input: NewOptionDto, @User() requestUser: RequestUser) {
    const result = await this.optionDataSource.create(input, requestUser);
    return this.success({
      data: result,
    });
  }

  /**
   * Update option.
   */
  @Put(':id')
  @Authorized()
  @RamAuthorized(OptionAction.Update)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Option model',
    type: () => createResponseSuccessType({}, 'UpdateOptionModelSuccessResp'),
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidatePayloadExistsPipe) model: UpdateOptionDto,
    @User() requestUser: RequestUser,
  ) {
    await this.optionDataSource.update(id, model, requestUser);
    return this.success();
  }

  /**
   * Delete option permanently.
   */
  @Delete(':id')
  @Authorized()
  @RamAuthorized(OptionAction.Delete)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Option model',
    type: () => createResponseSuccessType({}, 'DeleteOptionModelSuccessResp'),
  })
  async delete(@Param('id', ParseIntPipe) id: number, @User() requestUser: RequestUser, @I18n() i18n: I18nContext) {
    const result = await this.optionDataSource.delete(id, requestUser);
    if (result) {
      return this.success();
    } else {
      return this.faild(
        await i18n.tv('options.controller.option_does_not_exist', `Option "${id}" does not exist！`, {
          args: { id },
        }),
        400,
      );
    }
  }
}
