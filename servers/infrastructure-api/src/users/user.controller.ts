import { Response } from 'express';
import { ModuleRef } from '@nestjs/core';
import { ApiTags, ApiQuery, ApiOkResponse, ApiCreatedResponse, ApiNoContentResponse } from '@nestjs/swagger';
import {
  Controller,
  Scope,
  Query,
  Param,
  Body,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  ParseIntPipe,
  ParseArrayPipe,
  ParseEnumPipe,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { UserDataSource, UserStatus } from '@ace-pomelo/infrastructure-datasource';
import { Authorized } from '@ace-pomelo/authorization';
import { RamAuthorized } from '@ace-pomelo/ram-authorization';
import {
  ParseQueryPipe,
  ValidatePayloadExistsPipe,
  ApiAuthCreate,
  User,
  RequestUser,
  md5,
} from '@ace-pomelo/shared-server';
import { createResponseSuccessType } from '@/common/utils/swagger-type.util';
import { createMetaController } from '@/common/controllers/meta.controller';
import { UserAction } from '@/common/actions';
import { NewUserDto } from './dto/new-user.dto';
import { NewUserMetaDto } from './dto/new-user-meta.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PagedUserQueryDto } from './dto/user-query.dto';
import { UserModelResp, UserWithMetasModelResp, PagedUserResp, UserMetaModelResp } from './resp/user-model.resp';

@ApiTags('user')
@Authorized()
@Controller({ path: 'api/users', scope: Scope.REQUEST })
export class UserController extends createMetaController('user', UserMetaModelResp, NewUserMetaDto, UserDataSource, {
  authDecorator: (method) => {
    const ramAction =
      method === 'getMeta'
        ? UserAction.MetaDetail
        : method === 'getMetas'
        ? UserAction.MetaList
        : method === 'createMeta' || method === 'createMetas'
        ? UserAction.MetaCreate
        : method === 'updateMeta' || method === 'updateMetaByKey'
        ? UserAction.MetaUpdate
        : UserAction.MetaDelete;

    return [RamAuthorized(ramAction), ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])];
  },
}) {
  constructor(protected readonly moduleRef: ModuleRef, private readonly userDataSource: UserDataSource) {
    super(moduleRef);
  }

  /**
   * Get user model by id
   */
  @Get(':id')
  @RamAuthorized(UserAction.Detail)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiQuery({
    name: 'metaKeys',
    type: [String],
    required: false,
    example: ['firstName', 'lastName'],
    description: `return specific keys' metas if setted, otherwish all "metas" field return in "data".`,
  })
  @ApiOkResponse({
    description: 'User model',
    type: () => createResponseSuccessType({ data: UserWithMetasModelResp }, 'UserModelSuccessResp'),
  })
  @ApiNoContentResponse({
    description: 'User not found',
  })
  async get(
    @Param('id', ParseIntPipe) id: number,
    @Query('metaKeys', new ParseArrayPipe({ optional: true })) metaKeys: string[] | undefined,
    @User() requestUser: RequestUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.userDataSource.get(
      id,
      ['id', 'loginName', 'niceName', 'displayName', 'mobile', 'email', 'url', 'status', 'updatedAt', 'createdAt'],
      Number(requestUser.sub),
    );

    let metas;
    if (result) {
      metas = await this.userDataSource.getMetas(id, metaKeys ?? 'ALL', ['id', 'userId', 'metaKey', 'metaValue']);
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
   * Get paged user model
   */
  @Get()
  @RamAuthorized(UserAction.PagedList)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Paged user models',
    type: () => createResponseSuccessType({ data: PagedUserResp }, 'PagedUserSuccessResp'),
  })
  async getPaged(@Query(ParseQueryPipe) query: PagedUserQueryDto, @User() requestUser: RequestUser) {
    const result = await this.userDataSource.getPaged(
      query,
      ['id', 'loginName', 'niceName', 'displayName', 'mobile', 'email', 'url', 'status', 'updatedAt', 'createdAt'],
      Number(requestUser.sub),
    );

    return this.success({
      data: result,
    });
  }

  /**
   * Create user
   */
  @Post()
  @RamAuthorized(UserAction.Create)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiCreatedResponse({
    description: 'User model',
    type: () => createResponseSuccessType({ data: UserModelResp }, 'UserModelSuccessResp'),
  })
  async create(@Body() input: NewUserDto, @User() requestUser: RequestUser) {
    const { id, loginName, niceName, displayName, mobile, email, url, status, updatedAt, createdAt } =
      await this.userDataSource.create(
        { ...input, loginPwd: md5(input.loginPwd).toString(), niceName: input.loginName, displayName: input.loginName },
        Number(requestUser.sub),
      );
    return this.success({
      data: {
        id,
        loginName,
        niceName,
        displayName,
        mobile,
        email,
        url,
        status,
        updatedAt,
        createdAt,
      },
    });
  }

  /**
   * Update user
   */
  @Put(':id')
  @RamAuthorized(UserAction.Update)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}, 'UpdateUserModelSuccessResp'),
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidatePayloadExistsPipe) model: UpdateUserDto,
    @User() requestUser: RequestUser,
  ) {
    try {
      await this.userDataSource.update(id, model, Number(requestUser.sub));
      return this.success();
    } catch (e: any) {
      this.logger.error(e);
      return this.faild(e.message);
    }
  }

  /**
   * Update user status
   */
  @Patch(':id/status')
  @RamAuthorized(UserAction.UpdateStatus)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: '"true" if success or "false" if user does not exist',
    type: () => createResponseSuccessType({}, 'UpdateUserStatusModelSuccessResp'),
  })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Query('status', new ParseEnumPipe(UserStatus)) status: UserStatus,
    @User() requestUser: RequestUser,
  ) {
    try {
      await this.userDataSource.updateStatus(id, status, Number(requestUser.sub));
      return this.success();
    } catch (e: any) {
      this.logger.error(e);
      return this.faild(e.message);
    }
  }

  /**
   * Delete user permanently (must be in "trash" status)
   */
  @Delete(':id')
  @RamAuthorized(UserAction.Delete)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}, 'DeleteUserModelSuccessResp'),
  })
  async delete(@Param('id', ParseIntPipe) id: number, @User() requestUser: RequestUser) {
    try {
      await this.userDataSource.delete(id, Number(requestUser.sub));
      return this.success();
    } catch (e: any) {
      this.logger.error(e);
      return this.faild(e.message);
    }
  }
}
