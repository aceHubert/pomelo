import { snakeCase } from 'lodash';
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { INFRASTRUCTURE_SERVICE, UserMetaPresetKeys, UserPattern } from '@ace-pomelo/shared/server';
import { UserModel } from './interfaces/user-model.interface';
import { UserClaims } from './interfaces/user-claims.interface';

@Injectable()
export class UserService {
  constructor(@Inject(INFRASTRUCTURE_SERVICE) protected readonly basicService: ClientProxy) {}

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
}
