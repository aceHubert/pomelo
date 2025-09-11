import moment from 'moment';
import { snakeCase } from 'lodash-es';
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthorizationService } from '@ace-pomelo/nestjs-pomelo-authorization';
import { INFRASTRUCTURE_SERVICE, UserMetaPresetKeys, UserPattern } from '@ace-pomelo/shared/server';
import { UserOptions } from './interfaces/user-options.interface';
import { UserModel } from './interfaces/user-model.interface';
import { UserClaims } from './interfaces/user-claims.interface';
import { USER_OPTIONS } from './constants';

@Injectable()
export class UserService {
  constructor(
    @Inject(INFRASTRUCTURE_SERVICE) protected readonly basicService: ClientProxy,
    @Inject(USER_OPTIONS) private readonly options: UserOptions,
    private readonly authService: AuthorizationService,
  ) {}

  /**
   * Get user
   * @param id User id
   * @param fields Fields to get
   * @param requestUserId Request user id
   */
  getUser(
    id: number,
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
    requestUserId: number,
  ) {
    return this.basicService
      .send<UserModel | undefined>(UserPattern.Get, {
        id,
        fields,
        requestUserId,
      })
      .lastValue();
  }

  /**
   * Get user metas
   * @param id User id
   * @param metaKeys Meta keys
   * @param fields Fields to get
   */
  getMetas(id: number, metaKeys: string[], fields = ['id', 'metaKey', 'metaValue']) {
    return this.basicService
      .send<Array<{ id: string; metaKey: string; metaValue: string }>>(UserPattern.GetMetas, {
        userId: id,
        metaKeys,
        fields,
      })
      .lastValue();
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
      updated_at: new Date(user.updatedAt).getTime(),
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
