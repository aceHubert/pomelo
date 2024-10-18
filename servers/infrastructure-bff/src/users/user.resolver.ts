import { Request } from 'express';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Resolver, Context, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { I18n, I18nContext } from 'nestjs-i18n';
import { ResolveTree } from 'graphql-parse-resolve-info';
import { VoidResolver } from 'graphql-scalars';
import { AuthorizationService, Authorized, Anonymous } from '@ace-pomelo/nestjs-authorization';
import { RamAuthorized } from '@ace-pomelo/nestjs-ram-authorization';
import {
  Fields,
  User,
  RequestUser,
  md5,
  UserStatus,
  UserRole,
  OptionPresetKeys,
  INFRASTRUCTURE_SERVICE,
  OptionPattern,
  UserPattern,
} from '@ace-pomelo/shared/server';
import { UserAction } from '@/common/actions';
import { createMetaResolver } from '@/common/resolvers/meta.resolver';
import { UserService } from './user.service';
import { UserClaims } from './interfaces/user-claims.interface';
import { UserOptions } from './interfaces/user-options.interface';
import { NewUserInput } from './dto/new-user.input';
import { NewUserMetaInput } from './dto/new-user-meta.input';
import { UpdateUserInput } from './dto/update-user.input';
import { PagedUserArgs } from './dto/user.args';
import { VerifyUserInput } from './dto/verify-user.input';
import { User as UserModel, UserMeta, PagedUser, UserVerifyResult } from './models/user.model';
import { USER_OPTIONS } from './constants';

@Authorized()
@Resolver(() => UserModel)
export class UserResolver extends createMetaResolver(UserModel, UserMeta, NewUserMetaInput, {
  modelName: 'user',
  authDecorator: (method) => {
    const ramAction =
      method === 'getMeta'
        ? UserAction.MetaDetail
        : method === 'getMetas' || method === 'fieldMetas'
        ? UserAction.MetaList
        : method === 'createMeta' || method === 'createMetas'
        ? UserAction.MetaCreate
        : method === 'updateMeta' || method === 'updateMetaByKey'
        ? UserAction.MetaUpdate
        : UserAction.MetaDelete;

    return RamAuthorized(ramAction);
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

  @RamAuthorized(UserAction.Detail)
  @Query((returns) => UserModel, { nullable: true, description: 'Get user.' })
  user(
    @Args('id', { type: () => ID, description: 'User id' }) id: number,
    @Fields() fields: ResolveTree,
    @User() requestUser: RequestUser,
  ): Promise<UserModel | undefined> {
    return this.basicService
      .send<UserModel | undefined>(UserPattern.Get, {
        id,
        fields: this.getFieldNames(fields.fieldsByTypeName.UserModel),
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();
  }

  @RamAuthorized(UserAction.PagedList)
  @Query((returns) => PagedUser, { description: 'Get paged users.' })
  users(
    @Args() args: PagedUserArgs,
    @Fields() fields: ResolveTree,
    @User() requestUser: RequestUser,
  ): Promise<PagedUser> {
    return this.basicService
      .send<PagedUser>(UserPattern.GetPaged, {
        query: args,
        fields: this.getFieldNames(fields.fieldsByTypeName.PagedUser),
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();
  }

  @RamAuthorized(UserAction.Create)
  @Mutation((returns) => UserModel, { description: 'Create a new user.' })
  async createUser(
    @Args('model', { type: () => NewUserInput }) model: NewUserInput,
    @User() requestUser: RequestUser,
  ): Promise<UserModel> {
    let capabilities = model.capabilities;
    if (!capabilities) {
      capabilities = await this.basicService
        .send<UserRole>(OptionPattern.GetValue, {
          optionName: OptionPresetKeys.DefaultRole,
        })
        .lastValue();
    }
    const { id, loginName, niceName, displayName, mobile, email, url, status, updatedAt, createdAt } =
      await this.basicService
        .send<UserModel>(UserPattern.Create, {
          ...model,
          loginPwd: md5(model.loginPwd).toString(),
          niceName: model.loginName,
          displayName: model.loginName,
          status: UserStatus.Enabled,
          capabilities,
          requestUserId: Number(requestUser.sub),
        })
        .lastValue();

    return {
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
    };
  }

  @RamAuthorized(UserAction.Update)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Update user.' })
  async updateUser(
    @Args('id', { type: () => ID, description: 'User id' }) id: number,
    @Args('model', { type: () => UpdateUserInput }) model: UpdateUserInput,
    @User() requestUser: RequestUser,
  ): Promise<void> {
    await this.basicService
      .send<void>(UserPattern.Update, {
        ...model,
        id,
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();
  }

  @RamAuthorized(UserAction.UpdateStatus)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Update user stauts' })
  async updateUserStatus(
    @Args('id', { type: () => ID, description: 'User id' }) id: number,
    @Args('status', { type: () => UserStatus, description: 'status' }) status: UserStatus,
    @User() requestUser: RequestUser,
  ): Promise<void> {
    await this.basicService
      .send<void>(UserPattern.UpdateStatus, {
        id,
        status,
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();
  }

  @RamAuthorized(UserAction.Delete)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Delete user permanently.' })
  async deleteUser(
    @Args('id', { type: () => ID, description: 'User id' }) id: number,
    @User() requestUser: RequestUser,
  ): Promise<void> {
    await this.basicService
      .send<void>(UserPattern.Delete, {
        id,
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();
  }

  @Anonymous()
  @Mutation((returns) => UserVerifyResult, { description: 'Sign in.' })
  async signIn(
    @Args('model', { type: () => VerifyUserInput }) model: VerifyUserInput,
    @Context('req') req: Request,
    @I18n() i18n: I18nContext,
  ): Promise<UserVerifyResult> {
    const result = await this.basicService
      .send<false | UserModel>(UserPattern.Verify, {
        username: model.username,
        password: md5(model.password).toString(),
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

      return {
        success: true,
        token: await this.authService.createToken(
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
      };
    }
    return {
      success: false,
      message: i18n.tv('user.login.fail', 'Username or Password is incorrect!'),
    };
  }
}
