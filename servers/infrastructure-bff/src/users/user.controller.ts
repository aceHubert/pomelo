import { Request, Response } from 'express';
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
  Patch,
  Delete,
  ParseIntPipe,
  ParseArrayPipe,
  ParseEnumPipe,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { I18n, I18nContext } from 'nestjs-i18n';
import { AuthorizationService, Authorized, Anonymous } from '@ace-pomelo/nestjs-authorization';
import { RamAuthorized } from '@ace-pomelo/nestjs-ram-authorization';
import {
  ParseQueryPipe,
  ValidatePayloadExistsPipe,
  ApiAuthCreate,
  User,
  RequestUser,
  md5,
  createResponseSuccessType,
  OptionPresetKeys,
  UserStatus,
  UserRole,
  INFRASTRUCTURE_SERVICE,
  UserPattern,
  OptionPattern,
} from '@ace-pomelo/shared/server';
import { UserAction } from '@/common/actions';
import { createMetaController } from '@/common/controllers/meta.controller';
import { MetaModelResp } from '@/common/controllers/resp/meta-model.resp';
import { UserService } from './user.service';
import { UserClaims } from './interfaces/user-claims.interface';
import { UserOptions } from './interfaces/user-options.interface';
import { NewUserDto } from './dto/new-user.dto';
import { NewUserMetaDto } from './dto/new-user-meta.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PagedUserQueryDto } from './dto/user-query.dto';
import { VerifyUserDto } from './dto/verify-user.dto';
import { UserModelResp, UserWithMetasModelResp, PagedUserResp, UserMetaModelResp } from './resp/user-model.resp';
import { USER_OPTIONS } from './constants';

@ApiTags('user')
@Authorized()
@Controller({ path: 'api/users', scope: Scope.REQUEST })
export class UserController extends createMetaController('user', UserMetaModelResp, NewUserMetaDto, {
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
  constructor(
    @Inject(INFRASTRUCTURE_SERVICE) basicService: ClientProxy,
    @Inject(USER_OPTIONS) private readonly options: UserOptions,
    private readonly userService: UserService,
    private readonly authService: AuthorizationService,
  ) {
    super(basicService);
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
    const result = await this.userService.getUser(
      id,
      ['id', 'loginName', 'niceName', 'displayName', 'mobile', 'email', 'url', 'status', 'updatedAt', 'createdAt'],
      Number(requestUser.sub),
    );

    let metas;
    if (result) {
      metas = await this.basicService
        .send<MetaModelResp[]>(UserPattern.GetMetas, {
          userId: id,
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
    const result = await this.basicService
      .send<PagedUserResp>(UserPattern.GetPaged, {
        query,
        fields: [
          'id',
          'loginName',
          'niceName',
          'displayName',
          'mobile',
          'email',
          'url',
          'status',
          'updatedAt',
          'createdAt',
        ],
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();

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
    let capabilities = input.capabilities;
    if (!capabilities) {
      capabilities = await this.basicService
        .send<UserRole>(OptionPattern.GetValue, {
          optionName: OptionPresetKeys.DefaultRole,
        })
        .lastValue();
    }

    const { id, loginName, niceName, displayName, mobile, email, url, status, updatedAt, createdAt } =
      await this.basicService
        .send<UserModelResp>(UserPattern.Create, {
          ...input,
          loginPwd: md5(input.loginPwd).toString(),
          niceName: input.loginName,
          displayName: input.loginName,
          status: UserStatus.Enabled,
          capabilities,
          requestUserId: Number(requestUser.sub),
        })
        .lastValue();

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
      await this.basicService
        .send<void>(UserPattern.Update, {
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
      await this.basicService
        .send<void>(UserPattern.UpdateStatus, {
          id,
          status,
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
      await this.basicService
        .send<void>(UserPattern.Delete, {
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
   * Sign in
   */
  @Post('signin')
  @Anonymous()
  async signIn(@Body() input: VerifyUserDto, @Req() req: Request, @I18n() i18n: I18nContext) {
    const result = await this.basicService
      .send<false | UserModelResp>(UserPattern.Verify, {
        username: input.username,
        password: md5(input.password).toString(),
      })
      .lastValue();
    if (result) {
      const account: UserClaims = {
        id: result.id,
        login_name: result.loginName,
        display_name: result.displayName,
        nice_name: result.niceName,
        url: result.url,
        updated_at: new Date(result.updatedAt).getTime(),
      };

      if (result.email) {
        account['email'] = result.email;
        account['email_verified'] = true;
      }

      if (result.mobile) {
        account['phone_number'] = result.mobile;
        account['phone_number_verified'] = true;
      }

      const claims = await this.userService.getClaims(result.id);
      const { id: accountId, ...rest } = account;

      return this.success({
        data: await this.authService.createToken(
          {
            sub: String(accountId),
            ...claims,
            ...rest,
          },
          this.options.privateKey,
          {
            issuer: req.get('origin'),
            expiresIn: this.options.tokenExpiresIn,
          },
        ),
      });
    }
    return this.faild(i18n.tv('user.login.fail', 'Username or Password is incorrect!'));
  }
}
