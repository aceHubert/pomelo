import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthorizationService } from '@ace-nestjs/authorization';
import { UserRole } from '@ace-pomelo/shared/server';
import { AccountProviderService } from '@/account-provider/account-provider.service';
import { ManagementLoginInput } from './dto/login.input';
import { ManagementCurrentUser } from './models/user.model';
import { ManagementTokenResponse } from './models/token.model';

const POLICY_NAME = 'IdentityManagementFullAccess';
const AUTH_FAILED_MESSAGE = 'Authentication failed';

@Injectable()
export class ManagementAccountService {
  constructor(
    private readonly accountProviderService: AccountProviderService,
    private readonly authorizationService: AuthorizationService,
    private readonly configService: ConfigService,
  ) {}

  async login(input: ManagementLoginInput): Promise<ManagementTokenResponse> {
    const accountId = await this.verifyAccount(input.username, input.password);
    const claims = await this.accountProviderService.getClaims(Number(accountId));

    if (!this.isSuperAdministrator(claims.super_administrator) || !this.isAdministrator(claims)) {
      throw new UnauthorizedException(AUTH_FAILED_MESSAGE);
    }

    const expiresIn = this.configService.get<string | number>('JWT_EXPIRES_IN', '1h');
    const issuedAt = Math.floor(Date.now() / 1000);
    const accessToken = await this.authorizationService.createToken(
      {
        sub: accountId,
        role: UserRole.Administrator,
        super_administrator: true,
        ram: {
          PolicyName: POLICY_NAME,
          Statements: [
            {
              Effect: 'Allow',
              Action: ['identity:*'],
              Resource: ['*'],
            },
          ],
        },
      },
      { expiresIn },
    );

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn,
      issuedAt,
    };
  }

  async getCurrentUser(accountId: string | number): Promise<ManagementCurrentUser> {
    const [account, claims] = await Promise.all([
      this.accountProviderService.getAccount({ id: Number(accountId) }),
      this.accountProviderService.getClaims(Number(accountId)),
    ]);

    if (!account) {
      throw new NotFoundException('User not found');
    }

    return {
      id: Number(account.id),
      loginName: String(account.login_name || account.preferred_username || account.id),
      niceName: String(account.nice_name || account.nickname || account.display_name || account.login_name || ''),
      displayName: String(
        account.display_name || account.name || account.nice_name || account.login_name || account.id,
      ),
      avatar: (claims.avatar || account.picture) as string | undefined,
      email: account.email,
      mobile: account.phone_number,
      url: (account.url || account.website) as string | undefined,
    };
  }

  private async verifyAccount(username: string, password: string): Promise<string> {
    try {
      const accountId = await this.accountProviderService.verifyAccount(username, password);
      if (!accountId) {
        throw new UnauthorizedException(AUTH_FAILED_MESSAGE);
      }
      return accountId;
    } catch {
      throw new UnauthorizedException(AUTH_FAILED_MESSAGE);
    }
  }

  private isSuperAdministrator(value: unknown): boolean {
    return value === true || value === 1 || value === '1' || value === 'true';
  }

  private isAdministrator(claims: Record<string, unknown>): boolean {
    return claims.role === UserRole.Administrator || claims.capabilities === UserRole.Administrator;
  }
}
