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
  OnModuleInit,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Authorized, Anonymous } from '@ace-pomelo/nestjs-authorization';
import { RamAuthorized } from '@ace-pomelo/nestjs-ram-authorization';
import {
  describeType,
  createResponseSuccessType,
  User,
  ApiAuthCreate,
  ParseQueryPipe,
  ValidatePayloadExistsPipe,
  RequestUser,
  POMELO_SERVICE_PACKAGE_NAME,
} from '@ace-pomelo/shared/server';
import { OptionServiceClient, OPTION_SERVICE_NAME } from '@ace-pomelo/shared/server/proto-ts/option';
import { OptionAction } from '@/common/actions';
import { BaseController } from '@/common/controllers/base.controller';
import { OptionQueryDto } from './dto/option-query.dto';
import { NewOptionDto } from './dto/new-option.dto';
import { UpdateOptionDto } from './dto/update-option.dto';
import { OptionResp } from './resp/option.resp';

@ApiTags('options')
@Authorized()
@Controller('api/options')
export class OptionController extends BaseController implements OnModuleInit {
  private optionServiceClient!: OptionServiceClient;

  constructor(@Inject(POMELO_SERVICE_PACKAGE_NAME) private readonly client: ClientGrpc) {
    super();
  }

  onModuleInit() {
    this.optionServiceClient = this.client.getService<OptionServiceClient>(OPTION_SERVICE_NAME);
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
    const { options } = await this.optionServiceClient.getAutoloads({}).lastValue();
    return this.success({
      data: options,
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
    const { option } = await this.optionServiceClient
      .get({
        id,
        fields: ['id', 'optionName', 'optionValue', 'autoload'],
      })
      .lastValue();

    if (!option) {
      res.status(HttpStatus.NO_CONTENT);
    }
    return this.success({
      data: option,
    });
  }

  /**
   * Get option by name.
   */
  @Get(':name/by/name')
  @Anonymous()
  @ApiOkResponse({
    description: 'Option model',
    type: () => createResponseSuccessType({ data: OptionResp }, 'OptionModelSuccessResp'),
  })
  @ApiNoContentResponse({ description: 'Option not found' })
  async getByName(@Param('name') name: string, @Res({ passthrough: true }) res: Response) {
    const { option } = await this.optionServiceClient
      .getByName({ optionName: name, fields: ['id', 'optionName', 'optionValue', 'autoload'] })
      .lastValue();

    if (!option) {
      res.status(HttpStatus.NO_CONTENT);
    }
    return this.success({
      data: option,
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
    const { optionValue } = await this.optionServiceClient
      .getValue({
        optionName: name,
      })
      .lastValue();

    if (optionValue === undefined) {
      res.status(HttpStatus.NO_CONTENT);
    }
    return this.success({
      data: optionValue,
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
    const { options } = await this.optionServiceClient
      .getList({
        ...query,
        optionNames: query.optionNames ? { value: query.optionNames } : undefined,
        fields: ['id', 'optionName', 'optionValue', 'autoload'],
      })
      .lastValue();
    return this.success({
      data: options,
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
      await this.optionServiceClient.reset({}).lastValue();
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
    const { option } = await this.optionServiceClient
      .create({
        ...input,
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();
    return this.success({
      data: option,
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
      await this.optionServiceClient
        .update({
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
      await this.optionServiceClient
        .delete({
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
