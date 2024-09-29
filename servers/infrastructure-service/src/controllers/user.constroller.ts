import { Controller, ParseIntPipe, ParseArrayPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserCapability, UserPattern, ValidatePayloadExistsPipe } from '@ace-pomelo/shared/server';
import { UserDataSource, UserModel, PagedUserModel, UserMetaModel, NewUserMetaInput } from '../datasource/index';
import { Nullable } from '../types';
import { createMetaController } from './meta.controller';
import {
  IdOrUserNamePayload,
  PagedUserQueryPayolad,
  NewUserPayload,
  UpdateUserPayload,
  BulkDeleteUserPayload,
  DeleteUserPayLoad,
  VerifyUserPayload,
  UpdateLoginPwdPayload,
  UpdateUserStatusPayload,
  UpdateUserMobilePayload,
  UpdateUserEmailPayload,
} from './payload/user.payload';

@Controller()
export class UserController extends createMetaController<UserMetaModel, NewUserMetaInput>('user') {
  constructor(private readonly userDataSource: UserDataSource) {
    super(userDataSource);
  }

  @MessagePattern(UserPattern.Get)
  async getUser(
    @Payload('id', new ParseIntPipe({ optional: true })) id: Nullable<number>,
    @Payload('username') username: string | undefined,
    @Payload('requestUserId', new ParseIntPipe({ optional: true })) requestUserId: number | undefined,
    @Payload('requestUsername') requestUsername: string | undefined,
    @Payload('fields', new ParseArrayPipe({ items: String })) fields: string[],
  ): Promise<UserModel | undefined> {
    const idOrUserName = id || username;
    const requestUserIdOrUsername = requestUserId || requestUsername;
    if (idOrUserName && requestUserId) {
      return this.userDataSource.get(idOrUserName, fields, requestUserId);
    } else if (requestUserIdOrUsername) {
      return this.userDataSource.get(fields, requestUserIdOrUsername);
    } else if (idOrUserName) {
      return this.userDataSource.get(idOrUserName, fields);
    }
    return;
  }

  @MessagePattern(UserPattern.GetEmail)
  getEmail(
    @Payload(new ValidatePayloadExistsPipe({ oneOf: ['id', 'username'] })) payload: IdOrUserNamePayload,
  ): Promise<Pick<UserModel, 'id' | 'email'> | undefined> {
    return this.userDataSource.getEmail(payload.id || payload.username!);
  }

  @MessagePattern(UserPattern.GetMobile)
  getMobile(
    @Payload(new ValidatePayloadExistsPipe({ oneOf: ['id', 'username'] })) payload: IdOrUserNamePayload,
  ): Promise<Pick<UserModel, 'id' | 'mobile'> | undefined> {
    return this.userDataSource.getMobile(payload.id || payload.username!);
  }

  @MessagePattern(UserPattern.GetCapabilities)
  getCapabilities(
    @Payload('id', ParseIntPipe) id: number,
    @Payload('requestUserId', ParseIntPipe) requestUserId: number,
  ): Promise<UserCapability[]> {
    return this.userDataSource.getCapabilities(id, requestUserId);
  }

  @MessagePattern(UserPattern.HasCapability)
  async hasCapability(
    @Payload('id', ParseIntPipe) id: number,
    @Payload('capability') capability: UserCapability,
  ): Promise<boolean> {
    const capabilities = await this.userDataSource.getCapabilities(id, id);
    return capabilities.includes(capability);
  }

  @MessagePattern(UserPattern.GetList)
  getList(
    @Payload('ids', new ParseArrayPipe({ items: Number })) ids: number[],
    @Payload('fields', new ParseArrayPipe({ items: String })) fields: string[],
    @Payload('requestUserId', new ParseIntPipe({ optional: true })) requestUserId?: number,
  ): Promise<UserModel[]> {
    return this.userDataSource.getList(ids, fields, requestUserId);
  }

  @MessagePattern(UserPattern.GetPaged)
  getPaged(
    @Payload('query') query: PagedUserQueryPayolad,
    @Payload('fields', new ParseArrayPipe({ items: String })) fields: string[],
    @Payload('requestUserId', ParseIntPipe) requestUserId: number,
  ): Promise<PagedUserModel> {
    return this.userDataSource.getPaged(query, fields, requestUserId);
  }

  @MessagePattern(UserPattern.CountByStatus)
  getCountByStatus(@Payload('requestUserId', ParseIntPipe) requestUserId: number) {
    return this.userDataSource.getCountByStatus(requestUserId);
  }

  @MessagePattern(UserPattern.CountByRole)
  getCountByRole(@Payload('requestUserId', ParseIntPipe) requestUserId: number) {
    return this.userDataSource.getCountByRole(requestUserId);
  }

  @MessagePattern(UserPattern.LoginNameExists)
  async isLoginNameExists(@Payload('loginName') loginName: string): Promise<boolean> {
    if (!loginName) return true;

    return this.userDataSource.isLoginNameExists(loginName);
  }

  @MessagePattern(UserPattern.MobileExists)
  async isMobileExists(@Payload('mobile') mobile: string): Promise<boolean> {
    if (!mobile) return true;

    return this.userDataSource.isMobileExists(mobile);
  }

  @MessagePattern(UserPattern.EmailExists)
  async isEmailExists(@Payload('email') email: string): Promise<boolean> {
    if (!email) return true;

    return this.userDataSource.isEmailExists(email);
  }

  @MessagePattern(UserPattern.Create)
  create(@Payload() payload: NewUserPayload): Promise<UserModel> {
    const { requestUserId, ...model } = payload;
    return this.userDataSource.create(model, requestUserId);
  }

  @MessagePattern(UserPattern.Update)
  update(@Payload() payload: UpdateUserPayload): Promise<void> {
    const { id, requestUserId, ...model } = payload;
    return this.userDataSource.update(id, model, requestUserId);
  }

  @MessagePattern(UserPattern.UpdateEmail)
  updateEmail(@Payload() payload: UpdateUserEmailPayload): Promise<void> {
    return this.userDataSource.updateEmail(payload.id, payload.email, payload.requestUserId);
  }

  @MessagePattern(UserPattern.UpdateMobile)
  updateMobile(@Payload() payload: UpdateUserMobilePayload): Promise<void> {
    return this.userDataSource.updateMobile(payload.id, payload.mobile, payload.requestUserId);
  }

  @MessagePattern(UserPattern.UpdateStatus)
  updateStatus(@Payload() payload: UpdateUserStatusPayload): Promise<void> {
    return this.userDataSource.updateStatus(payload.id, payload.status, payload.requestUserId);
  }

  @MessagePattern(UserPattern.UpdatePassword)
  updateLoginPwd(
    @Payload(new ValidatePayloadExistsPipe({ oneOf: ['id', 'username'] })) payload: UpdateLoginPwdPayload,
  ): Promise<void> {
    return this.userDataSource.updateLoginPwd(payload.id || payload.username!, payload.oldPwd, payload.newPwd);
  }

  @MessagePattern(UserPattern.ResetPassword)
  resetLoginPwd(@Payload('id') id: number, @Payload('password') password: string): Promise<void> {
    return this.userDataSource.resetLoginPwd(id, password);
  }

  @MessagePattern(UserPattern.Verify)
  verifyUser(@Payload() payload: VerifyUserPayload): Promise<false | UserModel> {
    return this.userDataSource.verifyUser(payload.username, payload.password);
  }

  @MessagePattern(UserPattern.Delete)
  delete(@Payload() payload: DeleteUserPayLoad): Promise<void> {
    return this.userDataSource.delete(payload.id, payload.requestUserId);
  }

  @MessagePattern(UserPattern.BulkDelete)
  bulkDelete(@Payload() payload: BulkDeleteUserPayload): Promise<void> {
    return this.userDataSource.bulkDelete(payload.ids, payload.requestUserId);
  }
}
