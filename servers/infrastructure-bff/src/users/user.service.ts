import moment from 'moment';
import { snakeCase } from 'lodash';
import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { AuthorizationService } from '@ace-pomelo/nestjs-authorization';
import { UserMetaPresetKeys, POMELO_SERVICE_PACKAGE_NAME } from '@ace-pomelo/shared/server';
import { UserServiceClient, UserModel, USER_SERVICE_NAME } from '@ace-pomelo/shared/server/proto-ts/user';
import { UserOptions } from './interfaces/user-options.interface';
import { UserClaims } from './interfaces/user-claims.interface';
import { USER_OPTIONS } from './constants';

@Injectable()
export class UserService implements OnModuleInit {
  private userServiceClient!: UserServiceClient;

  constructor(
    @Inject(USER_OPTIONS) private readonly options: UserOptions,
    @Inject(POMELO_SERVICE_PACKAGE_NAME) protected readonly client: ClientGrpc,
    private readonly authService: AuthorizationService,
  ) {}

  onModuleInit() {
    this.userServiceClient = this.client.getService<UserServiceClient>(USER_SERVICE_NAME);
  }

  /**
   * Get user
   * @param id User id
   * @param fields Fields to get
   * @param requestUserId Request user id
   */
  getUser(
    id: number,
    requestUserId: number,
    fields = [
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
  ) {
    return this.userServiceClient
      .getUser({ id, fields, requestUserId })
      .lastValue()
      .then(({ user }) => user);
  }

  /**
   * Get user metas
   * @param id User id
   * @param metaKeys Meta keys
   * @param fields Fields to get
   */
  getMetas(id: number, metaKeys: string[], fields = ['id', 'metaKey', 'metaValue']) {
    return this.userServiceClient
      .getMetas({ userId: id, metaKeys, fields })
      .lastValue()
      .then(({ metas }) => metas);
  }

  /**
   * Get extra claims from user metas
   * @param id User id
   */
  async getClaims(id: number) {
    const metas = await this.getMetas(id, Object.values(UserMetaPresetKeys), ['metaKey', 'metaValue']);

    return metas.reduce((acc, meta) => {
      switch (meta.metaKey) {
        case UserMetaPresetKeys.VerifingEmail:
          acc['email'] = meta.metaValue;
          acc['email_verified'] = false;
          break;
        case UserMetaPresetKeys.VerifingMobile:
          acc['phone_number'] = meta.metaValue;
          acc['phone_number_verified'] = false;
          break;
        case UserMetaPresetKeys.Capabilities:
          acc['role'] = meta.metaValue;
          break;
        default:
          acc[snakeCase(meta.metaKey)] = meta.metaValue;
      }
      return acc;
    }, {} as Omit<UserClaims, 'id'>);
  }

  /**
   * Create access token
   * @param user UserModel
   * @param issuer Issuer
   */
  async createAccessToken(user: UserModel, issuer?: string) {
    const account: UserClaims = {
      id: user.id,
      login_name: user.loginName,
      display_name: user.displayName,
      nice_name: user.niceName,
      url: user.url,
      updated_at: user.updatedAt.getTime(),
    };

    if (user.email) {
      account['email'] = user.email;
      account['email_verified'] = true;
    }

    if (user.mobile) {
      account['phone_number'] = user.mobile;
      account['phone_number_verified'] = true;
    }

    const claims = await this.getClaims(user.id);
    const { id: accountId, ...rest } = account;

    const accessToken = await this.authService.createToken(
      {
        sub: String(accountId),
        ...claims,
        ...rest,
      },
      {
        issuer,
        expiresIn: this.options.tokenExpiresIn,
      },
    );
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresAt: moment().add(this.options.tokenExpiresIn).valueOf(),
    };
  }
}
