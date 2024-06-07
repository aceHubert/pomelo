import { ModuleRef } from '@nestjs/core';
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ResolveTree } from 'graphql-parse-resolve-info';
import { VoidResolver } from 'graphql-scalars';
import { Authorized } from '@ace-pomelo/nestjs-oidc';
import { RamAuthorized } from '@ace-pomelo/ram-authorization';
import { Fields, User, RequestUser, md5 } from '@ace-pomelo/shared-server';
import { OptionDataSource, UserDataSource, UserStatus, OptionPresetKeys } from '@ace-pomelo/infrastructure-datasource';
import { UserAction } from '@/common/actions';
import { createMetaResolver } from '@/common/resolvers/meta.resolver';
import { NewUserInput } from './dto/new-user.input';
import { NewUserMetaInput } from './dto/new-user-meta.input';
import { UpdateUserInput } from './dto/update-user.input';
import { PagedUserArgs } from './dto/user.args';
import { User as UserModel, UserMeta, PagedUser } from './models/user.model';

@Authorized()
@Resolver(() => UserModel)
export class UserResolver extends createMetaResolver(UserModel, UserMeta, NewUserMetaInput, UserDataSource, {
  resolverName: 'User',
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
    protected readonly moduleRef: ModuleRef,
    private readonly optionDataSource: OptionDataSource,
    private readonly userDataSource: UserDataSource,
  ) {
    super(moduleRef);
  }

  @RamAuthorized(UserAction.Detail)
  @Query((returns) => UserModel, { nullable: true, description: 'Get user.' })
  user(
    @Args('id', { type: () => ID, description: 'User id' }) id: number,
    @Fields() fields: ResolveTree,
    @User() requestUser: RequestUser,
  ): Promise<UserModel | undefined> {
    return this.userDataSource.get(id, this.getFieldNames(fields.fieldsByTypeName.UserModel), Number(requestUser.sub));
  }

  @RamAuthorized(UserAction.PagedList)
  @Query((returns) => PagedUser, { description: 'Get paged users.' })
  users(
    @Args() args: PagedUserArgs,
    @Fields() fields: ResolveTree,
    @User() requestUser: RequestUser,
  ): Promise<PagedUser> {
    return this.userDataSource.getPaged(
      args,
      this.getFieldNames(fields.fieldsByTypeName.PagedUser.rows.fieldsByTypeName.PagedUser),
      Number(requestUser.sub),
    );
  }

  @RamAuthorized(UserAction.Create)
  @Mutation((returns) => UserModel, { description: 'Create a new user.' })
  async createUser(
    @Args('model', { type: () => NewUserInput }) input: NewUserInput,
    @User() requestUser: RequestUser,
  ): Promise<UserModel> {
    let capabilities = input.capabilities;
    if (!capabilities) {
      capabilities = await this.optionDataSource.getValue(OptionPresetKeys.DefaultRole);
    }
    const { id, loginName, niceName, displayName, mobile, email, url, status, updatedAt, createdAt } =
      await this.userDataSource.create(
        {
          ...input,
          loginPwd: md5(input.loginPwd).toString(),
          niceName: input.loginName,
          displayName: input.loginName,
          capabilities,
        },
        Number(requestUser.sub),
      );

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
    await this.userDataSource.update(id, model, Number(requestUser.sub));
  }

  @RamAuthorized(UserAction.UpdateStatus)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Update user stauts' })
  async updateUserStatus(
    @Args('id', { type: () => ID, description: 'User id' }) id: number,
    @Args('status', { type: () => UserStatus, description: 'status' }) status: UserStatus,
    @User() requestUser: RequestUser,
  ): Promise<void> {
    await this.userDataSource.updateStatus(id, status, Number(requestUser.sub));
  }

  @RamAuthorized(UserAction.Delete)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Delete user permanently.' })
  async deleteUser(
    @Args('id', { type: () => ID, description: 'User id' }) id: number,
    @User() requestUser: RequestUser,
  ): Promise<void> {
    await this.userDataSource.delete(id, Number(requestUser.sub));
  }
}
