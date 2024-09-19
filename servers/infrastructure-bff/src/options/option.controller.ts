import { Response } from 'express';
import { ApiTags, ApiOkResponse, ApiCreatedResponse, ApiNoContentResponse } from '@nestjs/swagger';
import {
  Inject,
  Controller,
  Query,
  Param,
  Body,
  Get,
  Post,
  Put,
  Delete,
  ParseIntPipe,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Authorized, Anonymous } from '@ace-pomelo/authorization';
import { RamAuthorized } from '@ace-pomelo/ram-authorization';
import {
  describeType,
  createResponseSuccessType,
  User,
  ApiAuthCreate,
  ParseQueryPipe,
  ValidatePayloadExistsPipe,
  RequestUser,
  INFRASTRUCTURE_SERVICE,
  OptionPattern,
} from '@ace-pomelo/shared/server';
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
  constructor(@Inject(INFRASTRUCTURE_SERVICE) private readonly basicService: ClientProxy) {
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
    const result = await this.basicService.send<Record<string, string>>(OptionPattern.GetAutoloads, {}).lastValue();
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
    const result = await this.basicService
      .send<OptionResp | undefined>(OptionPattern.Get, {
        id,
        fields: ['id', 'optionName', 'optionValue', 'autoload'],
      })
      .lastValue();
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
    const value = await this.basicService
      .send<string | undefined>(OptionPattern.GetValue, {
        optionName: name,
      })
      .lastValue();
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
    const result = await this.basicService
      .send<OptionResp[]>(OptionPattern.GetList, {
        query,
        fields: ['id', 'optionName', 'optionValue', 'autoload'],
      })
      .lastValue();
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
  async clearCache() {
    try {
      await this.basicService.send<void>(OptionPattern.Reset, {}).lastValue();
      return this.success();
    } catch (e: any) {
      this.logger.error(e);
      return this.faild(e.message);
    }
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
    const result = await this.basicService
      .send<OptionResp>(OptionPattern.Create, {
        ...input,
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();
    return this.success({
      data: result,
    });
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
    @Body(ValidatePayloadExistsPipe) input: UpdateOptionDto,
    @User() requestUser: RequestUser,
  ) {
    try {
      await this.basicService
        .send<void>(OptionPattern.Update, {
          ...input,
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
      await this.basicService
        .send<void>(OptionPattern.Delete, {
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
}
