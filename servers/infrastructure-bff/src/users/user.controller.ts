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
  OnModuleInit,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { I18n, I18nContext } from 'nestjs-i18n';
import { Authorized, Anonymous } from '@ace-pomelo/nestjs-authorization';
import { RamAuthorized } from '@ace-pomelo/nestjs-ram-authorization';
import {
  md5,
  createResponseSuccessType,
  User,
  RequestUser,
  ParseQueryPipe,
  ValidatePayloadExistsPipe,
  ApiAuthCreate,
  OptionPresetKeys,
  UserStatus,
  POMELO_SERVICE_PACKAGE_NAME,
} from '@ace-pomelo/shared/server';
import { UserServiceClient, USER_SERVICE_NAME } from '@ace-pomelo/shared/server/proto-ts/user';
import { OptionServiceClient, OPTION_SERVICE_NAME } from '@ace-pomelo/shared/server/proto-ts/option';
import { UserAction } from '@/common/actions';
import { createMetaController } from '@/common/controllers/meta.controller';
import { UserService } from './user.service';
import { NewUserDto } from './dto/new-user.dto';
import { NewUserMetaDto } from './dto/new-user-meta.dto';
import { UpdateUserDto, UpdateUserPasswordDto, ResetUserPasswordDto } from './dto/update-user.dto';
import { PagedUserQueryDto } from './dto/user-query.dto';
import { SigninDto } from './dto/signin.dto';
import {
  UserModelResp,
  UserWithMetasModelResp,
  PagedUserResp,
  UserMetaModelResp,
  SignInResultResp,
} from './resp/user-model.resp';

@ApiTags('user')
@Authorized()
@Controller({ path: 'api/users', scope: Scope.REQUEST })
export class UserController
  extends createMetaController('user', UserMetaModelResp, NewUserMetaDto, {
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
  })
  implements OnModuleInit
{
  private userServiceClient!: UserServiceClient;
  private optionServiceClient!: OptionServiceClient;

  constructor(
    @Inject(POMELO_SERVICE_PACKAGE_NAME) private readonly client: ClientGrpc,
    private readonly userService: UserService,
  ) {
    super();
  }

  onModuleInit() {
    this.userServiceClient = this.client.getService<UserServiceClient>(USER_SERVICE_NAME);
    this.optionServiceClient = this.client.getService<OptionServiceClient>(OPTION_SERVICE_NAME);
  }

  get metaServiceClient() {
    return this.userServiceClient;
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
    const user = await this.userService.getUser(id, Number(requestUser.sub));

    let metas;
    if (user) {
      metas = await this.userService.getMetas(id, metaKeys ?? []);
    }

    if (user === undefined) {
      res.status(HttpStatus.NO_CONTENT);
    }

    return this.success({
      data: {
        ...user,
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
    const result = await this.userServiceClient
      .getPaged({
        ...query,
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
    let capabilities = input.capabilities as string | undefined;
    if (!capabilities) {
      ({ optionValue: capabilities } = await this.optionServiceClient
        .getValue({
          optionName: OptionPresetKeys.DefaultRole,
        })
        .lastValue());
    }

    const {
      user: { id, loginName, niceName, displayName, mobile, email, url, status, updatedAt, createdAt },
    } = await this.userServiceClient
      .create({
        ...input,
        loginPwd: md5(input.loginPwd).toString(),
        niceName: input.loginName,
        displayName: input.loginName,
        status: UserStatus.Enabled,
        capabilities,
        metas: [],
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
      await this.userServiceClient
        .update({
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
    description: 'no data content',
    type: () => createResponseSuccessType({}, 'UpdateUserStatusModelSuccessResp'),
  })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Query('status', new ParseEnumPipe(UserStatus)) status: UserStatus,
    @User() requestUser: RequestUser,
  ) {
    try {
      await this.userServiceClient.updateStatus({ id, status, requestUserId: Number(requestUser.sub) }).lastValue();
      return this.success();
    } catch (e: any) {
      this.logger.error(e);
      return this.faild(e.message);
    }
  }

  @Patch('password/update')
  @RamAuthorized(UserAction.UpdatePassword)
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}, 'UpdateUserPasswordModelSuccessResp'),
  })
  async updateLoginPassword(@Body() model: UpdateUserPasswordDto, @User() requestUser?: RequestUser) {
    try {
      await this.userServiceClient
        .updateLoginPassword({
          id: requestUser?.sub ? Number(requestUser.sub) : undefined,
          username: model.username,
          oldPwd: md5(model.oldPwd),
          newPwd: md5(model.newPwd),
        })
        .lastValue();
      return this.success();
    } catch (e: any) {
      this.logger.error(e);
      return this.faild(e.message);
    }
  }

  @Patch('password/reset')
  @RamAuthorized(UserAction.ResetPassword)
  @ApiOkResponse({
    description: 'no data content',
    type: () => createResponseSuccessType({}, 'ResetUserPasswordModelSuccessResp'),
  })
  async resetLoginPassword(@Body() model: ResetUserPasswordDto, @User() requestUser: RequestUser) {
    try {
      await this.userServiceClient
        .resetLoginPassword({
          id: model.id,
          newPwd: md5(model.newPwd),
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
      await this.userServiceClient
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

  /**
   * Sign in
   */
  @Post('signin')
  @Anonymous()
  @ApiOkResponse({
    description: 'user sign in result',
    type: () => createResponseSuccessType({ data: SignInResultResp }, 'UserSignInResultModelSuccessResp'),
  })
  async signIn(@Body() input: SigninDto, @Req() req: Request, @I18n() i18n: I18nContext) {
    const { verified, user } = await this.userServiceClient
      .verifyUser({
        username: input.username,
        password: md5(input.password).toString(),
      })
      .lastValue();
    if (verified) {
      const token = await this.userService.createAccessToken(user!, req.get('origin'));
      return this.success({
        data: {
          success: true,
          ...token,
        },
      });
    }
    return this.success({
      data: {
        success: false,
        message: i18n.tv('user.login.fail', 'Username or Password is incorrect!'),
      },
    });
  }
}
