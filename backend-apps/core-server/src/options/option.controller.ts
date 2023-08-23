import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { Controller, Query, Param, Body, Get, Post, Put, Delete, ParseIntPipe, HttpStatus } from '@nestjs/common';
import { Authorized, RamAuthorized } from 'nestjs-identity';
import { BaseController } from '@/common/controllers/base.controller';
import { describeType, createResponseSuccessType } from '@/common/utils/swagger-type.util';
import { ApiAuth } from '@/common/decorators/api-auth.decorator';
import { ParseQueryPipe } from '@/common/pipes/parse-query.pipe';
import { Actions } from '@/common/ram-actions';
import { User } from '@/common/decorators/user.decorator';
import { OptionDataSource } from '@/sequelize-datasources/datasources';
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
  async get(@Param('id', ParseIntPipe) id: number) {
    const result = await this.optionDataSource.get(id, ['id', 'optionName', 'optionValue', 'autoload']);
    this.success({
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
  async getValue(@Param('name') name: string) {
    const value = await this.optionDataSource.getOptionValue(name);
    return this.success({
      data: value,
    });
  }

  /**
   * Get options.
   */
  @Get()
  @Authorized()
  @RamAuthorized(Actions.Option.List)
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
  @RamAuthorized(Actions.Option.Create)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
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
  @RamAuthorized(Actions.Option.Update)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Option model',
    type: () => createResponseSuccessType({ data: Boolean }, 'UpdateOptionModelSuccessResp'),
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body('model') input: UpdateOptionDto,
    @User() requestUser: RequestUser,
  ) {
    const reault = await this.optionDataSource.update(id, input, requestUser);
    return this.success({
      data: reault,
    });
  }

  /**
   * Delete option permanently.
   */
  @Delete(':id')
  @Authorized()
  @RamAuthorized(Actions.Option.Delete)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Option model',
    type: () => createResponseSuccessType({ data: Boolean }, 'DeleteOptionModelSuccessResp'),
  })
  async delete(@Param('id', ParseIntPipe) id: number, @User() requestUser: RequestUser) {
    const reault = await this.optionDataSource.delete(id, requestUser);
    return this.success({
      data: reault,
    });
  }
}
