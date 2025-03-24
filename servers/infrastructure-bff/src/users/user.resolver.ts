import { Request } from 'express';
import { Inject, ParseIntPipe, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Resolver, Context, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { I18n, I18nContext } from 'nestjs-i18n';
import { ResolveTree } from 'graphql-parse-resolve-info';
import { VoidResolver } from 'graphql-scalars';
import { Authorized, Anonymous } from '@ace-pomelo/nestjs-authorization';
import { RamAuthorized } from '@ace-pomelo/nestjs-ram-authorization';
import {
  POMELO_SERVICE_PACKAGE_NAME,
  Fields,
  User,
  RequestUser,
  md5,
  UserStatus,
  OptionPresetKeys,
} from '@ace-pomelo/shared/server';
import { UserServiceClient, USER_SERVICE_NAME } from '@ace-pomelo/shared/server/proto-ts/user';
import { OptionServiceClient, OPTION_SERVICE_NAME } from '@ace-pomelo/shared/server/proto-ts/option';
import { UserAction } from '@/common/actions';
import { createMetaResolver } from '@/common/resolvers/meta.resolver';
import { UserService } from './user.service';
import { NewUserInput } from './dto/new-user.input';
import { NewUserMetaInput } from './dto/new-user-meta.input';
import { ResetUserPasswordInput, UpdateUserInput, UpdateUserPasswordInput } from './dto/update-user.input';
import { PagedUserArgs } from './dto/user.args';
import { SignInInput } from './dto/signin.input';
import { User as UserModel, UserMeta, PagedUser, SignInResult } from './models/user.model';

@Authorized()
@Resolver(() => UserModel)
export class UserResolver
  extends createMetaResolver('user', UserModel, UserMeta, NewUserMetaInput, {
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

  @RamAuthorized(UserAction.Detail)
  @Query((returns) => UserModel, { nullable: true, description: 'Get user.' })
  user(
    @Args('id', { type: () => ID, description: 'User id' }, ParseIntPipe) id: number,
    @Fields() fields: ResolveTree,
    @User() requestUser: RequestUser,
  ): Promise<UserModel | undefined> {
    return this.userService.getUser(id, Number(requestUser.sub), this.getFieldNames(fields.fieldsByTypeName.UserModel));
  }

  @RamAuthorized(UserAction.PagedList)
  @Query((returns) => PagedUser, { description: 'Get paged users.' })
  users(
    @Args() args: PagedUserArgs,
    @Fields() fields: ResolveTree,
    @User() requestUser: RequestUser,
  ): Promise<PagedUser> {
    return this.userServiceClient
      .getPaged({
        ...args,
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
    let capabilities = model.capabilities as string | undefined;
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
        ...model,
        loginPwd: md5(model.loginPwd).toString(),
        niceName: model.loginName,
        displayName: model.loginName,
        status: UserStatus.Enabled,
        capabilities,
        metas: model.metas || [],
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
    @Args('id', { type: () => ID, description: 'User id' }, ParseIntPipe) id: number,
    @Args('model', { type: () => UpdateUserInput }) model: UpdateUserInput,
    @User() requestUser: RequestUser,
  ): Promise<void> {
    await this.userServiceClient
      .update({
        ...model,
        id,
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();
  }

  @RamAuthorized(UserAction.UpdateStatus)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Update user stauts' })
  async updateUserStatus(
    @Args('id', { type: () => ID, description: 'User id' }, ParseIntPipe) id: number,
    @Args('status', { type: () => UserStatus, description: 'status' }) status: UserStatus,
    @User() requestUser: RequestUser,
  ): Promise<void> {
    await this.userServiceClient.updateStatus({ id, status, requestUserId: Number(requestUser.sub) }).lastValue();
  }

  @RamAuthorized(UserAction.UpdatePassword)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Update user password' })
  async updateLoginPassword(
    @Args('model', { type: () => UpdateUserPasswordInput }) model: UpdateUserPasswordInput,
    @User() requestUser?: RequestUser,
  ): Promise<void> {
    await this.userServiceClient
      .updateLoginPassword({
        id: requestUser ? Number(requestUser.sub) : undefined,
        username: model.username,
        oldPwd: md5(model.oldPwd),
        newPwd: md5(model.newPwd),
      })
      .lastValue();
  }

  @RamAuthorized(UserAction.ResetPassword)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Reset user password' })
  async resetLoginPassword(
    @Args('model', { type: () => ResetUserPasswordInput }) model: ResetUserPasswordInput,
    @User() requestUser: RequestUser,
  ): Promise<void> {
    await this.userServiceClient
      .resetLoginPassword({
        id: model.userId,
        newPwd: md5(model.newPwd),
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();
  }

  @RamAuthorized(UserAction.Delete)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Delete user permanently.' })
  async deleteUser(
    @Args('id', { type: () => ID, description: 'User id' }, ParseIntPipe) id: number,
    @User() requestUser: RequestUser,
  ): Promise<void> {
    await this.userServiceClient.delete({ id, requestUserId: Number(requestUser.sub) }).lastValue();
  }

  @Anonymous()
  @Mutation((returns) => SignInResult, { description: 'Sign in.' })
  async signIn(
    @Args('model', { type: () => SignInInput }) model: SignInInput,
    @Context('req') req: Request,
    @I18n() i18n: I18nContext,
  ): Promise<SignInResult> {
    const { verified, user } = await this.userServiceClient
      .verifyUser({ username: model.username, password: md5(model.password).toString() })
      .lastValue();
    if (verified) {
      const token = await this.userService.createAccessToken(user!, req.get('origin'));

      return {
        success: true,
        ...token,
      };
    }
    return {
      success: false,
      message: i18n.tv('user.login.fail', 'Username or Password is incorrect!'),
    };
  }
}
