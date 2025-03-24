import { Controller } from '@nestjs/common';
import { UserCapability } from '@ace-pomelo/shared/server';
import { Empty } from '@ace-pomelo/shared/server/proto-ts/google/protobuf/empty';
import { BoolValue } from '@ace-pomelo/shared/server/proto-ts/google/protobuf/wrappers';
import { RequestUserIdRequest } from '@ace-pomelo/shared/server/proto-ts/common/shared';
import {
  USER_SERVICE_NAME,
  UserServiceControllerMethods,
  UserServiceController,
  GetUserRequest,
  GetUserResponse,
  GetRequestUserRequest,
  GetRequestUserResponse,
  GetSpecificFieldUserRequest,
  GetUserEmailResponse,
  GetUserMobileResponse,
  GetUserCapabilitiesRequest,
  GetUserCapabilitiesResponse,
  HasUserCapabilityRequest,
  GetUsersRequest,
  GetUsersResponse,
  GetPagedUserRequest,
  GetPagedUserResponse,
  GetUserCountByRoleResponse,
  GetUserCountByStatusResponse,
  IsLoginNameExistsRequest,
  IsMobileExistsRequest,
  IsEmailExistsRequest,
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
  UpdateUserEmailRequest,
  UpdateUserMobileRequest,
  UpdateUserStatusRequest,
  UpdateLoginPwdRequest,
  ResetLoginPwdRequest,
  VerifyUserRequest,
  VerifyUserResponse,
  DeleteUserRequest,
  BulkDeleteUserRequest,
} from '@ace-pomelo/shared/server/proto-ts/user';
import { UserDataSource } from '../datasource';
import { createMetaController } from './meta.controller';

@Controller()
@UserServiceControllerMethods()
export class UserController extends createMetaController('user', USER_SERVICE_NAME) implements UserServiceController {
  constructor(private readonly userDataSource: UserDataSource) {
    super(userDataSource);
  }

  async getUser({ fields = [], id, username, requestUserId }: GetUserRequest): Promise<GetUserResponse> {
    return this.userDataSource.get(id || username!, fields, requestUserId).then((result) => {
      return { user: result };
    });
  }

  async getRequestUser({ fields, id, username }: GetRequestUserRequest): Promise<GetRequestUserResponse> {
    return this.userDataSource.get(fields, id || username!).then((result) => {
      return { user: result };
    });
  }

  getEmail({ id, username }: GetSpecificFieldUserRequest): Promise<GetUserEmailResponse> {
    return this.userDataSource.getEmail(id || username!).then((result) => {
      return { user: result };
    });
  }

  getMobile({ id, username }: GetSpecificFieldUserRequest): Promise<GetUserMobileResponse> {
    return this.userDataSource.getMobile(id || username!).then((result) => {
      return { user: result };
    });
  }

  getCapabilities({ id, requestUserId }: GetUserCapabilitiesRequest): Promise<GetUserCapabilitiesResponse> {
    return this.userDataSource.getCapabilities(requestUserId, id).then((result) => {
      return { capabilities: result };
    });
  }

  async hasCapability({ id, capability, requestUserId }: HasUserCapabilityRequest): Promise<BoolValue> {
    const capabilities = await this.userDataSource.getCapabilities(requestUserId, id);
    return { value: capabilities.includes(capability as UserCapability) };
  }

  getList({ ids, fields, requestUserId }: GetUsersRequest): Promise<GetUsersResponse> {
    return this.userDataSource.getList(ids, fields, requestUserId).then((result) => {
      return { users: result };
    });
  }

  getPaged({ fields, requestUserId, ...query }: GetPagedUserRequest): Promise<GetPagedUserResponse> {
    return this.userDataSource.getPaged(query, fields, requestUserId);
  }

  getCountByStatus({ requestUserId }: RequestUserIdRequest): Promise<GetUserCountByStatusResponse> {
    return this.userDataSource.getCountByStatus(requestUserId).then((result) => {
      return { counts: result };
    });
  }

  getCountByRole({ requestUserId }: RequestUserIdRequest): Promise<GetUserCountByRoleResponse> {
    return this.userDataSource.getCountByRole(requestUserId).then((result) => {
      return { counts: result };
    });
  }

  async isLoginNameExists({ loginName }: IsLoginNameExistsRequest): Promise<BoolValue> {
    // always return true if loginName is empty
    if (!loginName) return { value: true };

    return this.userDataSource.isLoginNameExists(loginName).then((result) => {
      return { value: result };
    });
  }

  async isMobileExists({ mobile }: IsMobileExistsRequest): Promise<BoolValue> {
    // always return true if mobile is empty
    if (!mobile) return { value: true };

    return this.userDataSource.isMobileExists(mobile).then((result) => {
      return { value: result };
    });
  }

  async isEmailExists({ email }: IsEmailExistsRequest): Promise<BoolValue> {
    // always return true if email is empty
    if (!email) return { value: true };

    return this.userDataSource.isEmailExists(email).then((result) => {
      return { value: result };
    });
  }

  create({ requestUserId, ...model }: CreateUserRequest): Promise<CreateUserResponse> {
    return this.userDataSource.create(model, requestUserId).then((result) => {
      return { user: result };
    });
  }

  update({ id, requestUserId, ...model }: UpdateUserRequest): Promise<Empty> {
    return this.userDataSource.update(requestUserId, model, id).then(() => {
      return {};
    });
  }

  updateEmail({ id, email, requestUserId }: UpdateUserEmailRequest): Promise<Empty> {
    return this.userDataSource.updateEmail(requestUserId, email, id).then(() => {
      return {};
    });
  }

  updateMobile({ id, mobile, requestUserId }: UpdateUserMobileRequest): Promise<Empty> {
    return this.userDataSource.updateMobile(requestUserId, mobile, id).then(() => {
      return {};
    });
  }

  updateStatus({ id, status, requestUserId }: UpdateUserStatusRequest): Promise<Empty> {
    return this.userDataSource.updateStatus(id, status, requestUserId).then(() => {
      return {};
    });
  }

  updateLoginPassword({ id, username, oldPwd, newPwd }: UpdateLoginPwdRequest): Promise<Empty> {
    return this.userDataSource.updateLoginPassowrd(id || username!, oldPwd, newPwd).then(() => {
      return {};
    });
  }

  resetLoginPassword({ id, newPwd, requestUserId }: ResetLoginPwdRequest): Promise<Empty> {
    return this.userDataSource.resetLoginPassword(requestUserId, newPwd, id).then(() => {
      return {};
    });
  }

  verifyUser({ username, password }: VerifyUserRequest): Promise<VerifyUserResponse> {
    return this.userDataSource.verifyUser(username, password).then((result) => {
      return result ? { verified: true, user: result } : { verified: false };
    });
  }

  delete({ id, requestUserId }: DeleteUserRequest): Promise<Empty> {
    return this.userDataSource.delete(id, requestUserId).then(() => {
      return {};
    });
  }

  bulkDelete({ ids, requestUserId }: BulkDeleteUserRequest): Promise<Empty> {
    return this.userDataSource.bulkDelete(ids, requestUserId).then(() => {
      return {};
    });
  }
}
