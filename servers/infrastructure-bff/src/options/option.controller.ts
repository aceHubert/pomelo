import { Response } from 'express';
import { ApiTags, ApiOkResponse, ApiNoContentResponse } from '@nestjs/swagger';
import { Controller, Query, Param, Body, Get, Put, ParseIntPipe, Res, HttpStatus } from '@nestjs/common';
import { Authorized, Anonymous } from '@ace-nestjs/authorization';
import { RamAuthorized } from '@ace-nestjs/ram-authorization';
import {
  describeType,
  createResponseSuccessType,
  User,
  ApiAuthCreate,
  ParseQueryPipe,
  ValidatePayloadExistsPipe,
  RequestUser,
  UserRole,
} from '@ace-pomelo/shared/server';
import { OptionAction } from '@/common/actions';
import { BaseController } from '@/common/controllers/base.controller';
import { OptionQueryDto } from './dto/option-query.dto';
import { UpdateOptionDto } from './dto/update-option.dto';
import { OptionService } from './option.service';
import { OptionResp, OptionValueResp } from './resp/option.resp';

@ApiTags('options')
@Authorized()
@Controller('api/options')
export class OptionController extends BaseController {
  constructor(private readonly optionService: OptionService) {
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
  async getAutoloadOptions(@User() requestUser?: RequestUser) {
    return this.success({
      data: await this.optionService.getAutoloadValues(this.getRequestUserRole(requestUser)),
    });
  }

  /**
   * Get option.
   */
  @Get(':id')
  @Anonymous()
  @ApiOkResponse({
    description: 'Option model',
    type: () => createResponseSuccessType({ data: OptionValueResp }, 'OptionModelSuccessResp'),
  })
  @ApiNoContentResponse({ description: 'Option not found' })
  async get(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
    @User() requestUser?: RequestUser,
  ) {
    const result = await this.optionService.getById(
      id,
      ['optionName', 'optionValue'],
      this.getRequestUserRole(requestUser),
    );
    if (result === undefined) {
      res.status(HttpStatus.NO_CONTENT);
    }
    return this.success({
      data: result,
    });
  }

  /**
   * Get option by name.
   */
  @Get(':name/by/name')
  @Anonymous()
  @ApiOkResponse({
    description: 'Option model',
    type: () => createResponseSuccessType({ data: OptionValueResp }, 'OptionModelSuccessResp'),
  })
  async getByName(@Param('name') name: string, @User() requestUser?: RequestUser) {
    const result = await this.optionService.getOption(
      name,
      ['optionName', 'optionValue'],
      this.getRequestUserRole(requestUser),
    );
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
  async getValue(@Param('name') name: string, @User() requestUser?: RequestUser) {
    const value = await this.optionService.getValue(name, this.getRequestUserRole(requestUser));
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
  async getList(@Query(ParseQueryPipe) query: OptionQueryDto, @User() requestUser: RequestUser) {
    return this.success({
      data: await this.optionService.getList<OptionResp>(
        query,
        ['id', 'optionName', 'optionValue'],
        this.getRequestUserRole(requestUser),
      ),
    });
  }

  /**
   * Update preset option.
   */
  @Put(':name')
  @RamAuthorized(OptionAction.Update)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}, 'UpdateOptionModelSuccessResp'),
  })
  async update(
    @Param('name') name: string,
    @Body(ValidatePayloadExistsPipe) input: UpdateOptionDto,
    @User() requestUser: RequestUser,
  ) {
    try {
      await this.optionService.updateOption(
        name,
        input.optionValue,
        this.getRequestUserRole(requestUser),
        Number(requestUser.sub),
      );
      return this.success();
    } catch (e: any) {
      this.logger.error(e);
      return this.faild(e.message);
    }
  }

  private getRequestUserRole(requestUser?: RequestUser): UserRole {
    const role = requestUser?.role ?? requestUser?.capabilities;

    return Object.values(UserRole).includes(role) ? role : UserRole.None;
  }
}
