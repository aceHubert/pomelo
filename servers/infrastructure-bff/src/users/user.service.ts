import md5 from 'md5';
import moment from 'moment';
import { snakeCase } from 'lodash';
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthorizationService } from '@ace-nestjs/authorization';
import { isEmail } from 'class-validator';
import {
  INFRASTRUCTURE_SERVICE,
  OptionPresetKeys,
  REGISTER_EMAIL_CODE_SCENE,
  UserInputError,
  UserMetaPresetKeys,
  UserPattern,
  UserRole,
  UserStatus,
  ValidationError,
} from '@ace-pomelo/shared/server';
import { AppCacheService } from '@/cache/cache.service';
import { OptionService } from '@/options/option.service';
import { RegisterEmailCodeInput, RegisterInput } from './dto/register.input';
import { UserOptions } from './interfaces/user-options.interface';
import { UserModel } from './interfaces/user-model.interface';
import { UserClaims } from './interfaces/user-claims.interface';
import { RegisterEmailCodeResult } from './models/register.model';
import { USER_OPTIONS } from './constants';
import { UserMailService } from './mail.service';
import { assertAllowedEmailSuffix, parseEmailSuffixes, randomDigits } from './user-auth.utils';

const REGISTER_CODE_TTL_MS = 10 * 60 * 1000;
const REGISTER_CODE_COOLDOWN_MS = 60 * 1000;

type RegisterCodeCache = {
  email: string;
  code: string;
  expiresAt: number;
};

@Injectable()
export class UserService {
  constructor(
    @Inject(INFRASTRUCTURE_SERVICE) protected readonly basicService: ClientProxy,
    @Inject(USER_OPTIONS) private readonly options: UserOptions,
    private readonly authService: AuthorizationService,
    private readonly cacheService: AppCacheService,
    private readonly optionService: OptionService,
    private readonly mailService: UserMailService,
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

  async sendRegisterEmailCode(input: RegisterEmailCodeInput): Promise<RegisterEmailCodeResult> {
    const email = input.email.trim().toLowerCase();
    await this.assertRegisterEnabled();
    this.assertValidEmail(email);
    await this.assertEmailSuffixAllowed(email);
    await this.assertEmailUnused(email);

    const cooldownKey = this.getRegisterCooldownKey(email);
    const cooldown = await this.cacheService.get<number>(cooldownKey);
    if (cooldown && cooldown > Date.now()) {
      throw new UserInputError('验证码发送过于频繁，请稍后再试');
    }

    const code = randomDigits();
    const expiresAt = Date.now() + REGISTER_CODE_TTL_MS;
    await this.mailService.send({
      scene: REGISTER_EMAIL_CODE_SCENE,
      to: email,
      variables: {
        code,
        email,
        expiresInMinutes: Math.floor(REGISTER_CODE_TTL_MS / 60_000),
      },
    });
    await this.cacheService.set<RegisterCodeCache>(
      this.getRegisterCodeKey(email),
      {
        email,
        code,
        expiresAt,
      },
      REGISTER_CODE_TTL_MS,
    );
    await this.cacheService.set(cooldownKey, Date.now() + REGISTER_CODE_COOLDOWN_MS, REGISTER_CODE_COOLDOWN_MS);

    return {
      success: true,
      expiresInSeconds: Math.floor(REGISTER_CODE_TTL_MS / 1000),
      cooldownSeconds: Math.floor(REGISTER_CODE_COOLDOWN_MS / 1000),
      message: '验证码已发送',
    };
  }

  async register(input: RegisterInput, issuer?: string) {
    const email = input.email.trim().toLowerCase();
    const username = input.username.trim();
    await this.assertRegisterEnabled();
    this.assertValidEmail(email);
    await this.assertEmailSuffixAllowed(email);
    await this.assertEmailUnused(email);
    await this.assertUsernameUnused(username);
    await this.assertRegisterCode(email, input.code);

    const capabilities = await this.getDefaultRole();
    const user = await this.basicService
      .send<UserModel>(UserPattern.AuthCreate, {
        loginName: username,
        loginPwd: md5(input.password).toString(),
        niceName: username,
        displayName: username,
        email,
        url: '',
        status: UserStatus.Enabled,
        capabilities,
      })
      .lastValue();
    await this.cacheService.del(this.getRegisterCodeKey(email));
    const token = await this.createAccessToken(user, issuer);

    return {
      success: true,
      ...token,
    };
  }

  async isRegisterUsernameAvailable(username: string): Promise<boolean> {
    await this.assertRegisterEnabled();

    const loginName = username.trim();
    if (!loginName) {
      return false;
    }

    const exists = await this.basicService.send<boolean>(UserPattern.LoginNameExists, { loginName }).lastValue();
    return !exists;
  }

  private async assertRegisterEnabled() {
    const enabled = await this.optionService.getRawValue(OptionPresetKeys.AuthRegisterEnable);
    if (enabled !== '1') {
      throw new UserInputError('注册暂未开放');
    }
  }

  private assertValidEmail(email: string) {
    if (!isEmail(email)) {
      throw new UserInputError('请输入正确的邮箱地址');
    }
  }

  private async assertEmailSuffixAllowed(email: string) {
    const suffixes = parseEmailSuffixes(
      await this.optionService.getRawValue(OptionPresetKeys.AuthRegisterEmailSuffixes),
    );
    assertAllowedEmailSuffix(email, suffixes);
  }

  private async assertEmailUnused(email: string) {
    const exists = await this.basicService.send<boolean>(UserPattern.EmailExists, { email }).lastValue();
    if (exists) {
      throw new ValidationError('邮箱已被使用');
    }
  }

  private async assertUsernameUnused(loginName: string) {
    if (!loginName) {
      throw new UserInputError('用户名不能为空');
    }

    const exists = await this.basicService.send<boolean>(UserPattern.LoginNameExists, { loginName }).lastValue();
    if (exists) {
      throw new ValidationError('用户名已被使用');
    }
  }

  private async assertRegisterCode(email: string, code: string) {
    const cached = await this.cacheService.get<RegisterCodeCache>(this.getRegisterCodeKey(email));
    if (!cached || cached.expiresAt < Date.now() || cached.code !== code.trim()) {
      throw new UserInputError('验证码无效或已过期');
    }
  }

  private async getDefaultRole() {
    return (await this.optionService.getRawValue(OptionPresetKeys.DefaultRole)) || UserRole.Subscriber;
  }

  private getRegisterCodeKey(email: string) {
    return `auth:register:email-code:${email}`;
  }

  private getRegisterCooldownKey(email: string) {
    return `auth:register:email-code-cooldown:${email}`;
  }
}
