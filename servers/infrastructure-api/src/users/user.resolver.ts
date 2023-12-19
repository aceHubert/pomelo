import { ModuleRef } from '@nestjs/core';
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { Authorized } from '@ace-pomelo/authorization';
import { RamAuthorized } from '@ace-pomelo/ram-authorization';
import { ResolveTree } from 'graphql-parse-resolve-info';
import { Fields, User, RequestUser } from '@ace-pomelo/shared-server';
import { UserDataSource, UserStatus } from '@ace-pomelo/infrastructure-datasource';
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
  constructor(protected readonly moduleRef: ModuleRef, private readonly userDataSource: UserDataSource) {
    super(moduleRef);
  }

  @RamAuthorized(UserAction.Detail)
  @Query((returns) => UserModel, { nullable: true, description: 'Get user.' })
  user(
    @Args('id', { type: () => ID, description: 'User id' }) id: number,
    @Fields() fields: ResolveTree,
    @User() requestUser: RequestUser,
  ): Promise<UserModel | undefined> {
    return this.userDataSource.get(id, this.getFieldNames(fields.fieldsByTypeName.UserModel), requestUser);
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
      requestUser,
    );
  }

  @RamAuthorized(UserAction.Create)
  @Mutation((returns) => UserModel, { description: 'Create a new user.' })
  async createUser(
    @Args('model', { type: () => NewUserInput }) input: NewUserInput,
    @User() requestUser: RequestUser,
  ): Promise<UserModel> {
    const { id, loginName, niceName, displayName, mobile, email, url, status, updatedAt, createdAt } =
      await this.userDataSource.create(
        { ...input, niceName: input.loginName, displayName: input.loginName },
        requestUser,
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
  @Mutation((returns) => Boolean, { description: 'Update user.' })
  async updateUser(
    @Args('id', { type: () => ID, description: 'User id' }) id: number,
    @Args('model', { type: () => UpdateUserInput }) model: UpdateUserInput,
    @User() requestUser: RequestUser,
  ): Promise<boolean> {
    return await this.userDataSource.update(id, model, requestUser);
  }

  @RamAuthorized(UserAction.UpdateStatus)
  @Mutation((returns) => Boolean, {
    description: 'Update user stauts',
  })
  updateUserStatus(
    @Args('id', { type: () => ID, description: 'User id' }) id: number,
    @Args('status', { type: () => UserStatus, description: 'status' }) status: UserStatus,
    @User() requestUser: RequestUser,
  ): Promise<Boolean> {
    return this.userDataSource.updateStatus(id, status, requestUser);
  }

  @RamAuthorized(UserAction.Delete)
  @Mutation((returns) => Boolean, {
    description: 'Delete user permanently.',
  })
  deleteUser(@Args('id', { type: () => ID, description: 'User id' }) id: number, @User() requestUser: RequestUser) {
    return this.userDataSource.delete(id, requestUser);
  }
}
