import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthorizationService } from '@ace-nestjs/authorization';
import { UserRole } from '@ace-pomelo/shared/server';
import { AccountProviderService } from '@/account-provider/account-provider.service';
import { ManagementLoginInput } from './dto/management-login.input';
import { ManagementTokenResponse } from './models/management-token.model';

const MANAGEMENT_POLICY_NAME = 'IdentityManagementFullAccess';
const MANAGEMENT_AUTH_FAILED_MESSAGE = 'Authentication failed';

@Injectable()
export class ManagementAuthService {
  constructor(
    private readonly accountProviderService: AccountProviderService,
    private readonly authorizationService: AuthorizationService,
    private readonly configService: ConfigService,
  ) {}

  async login(input: ManagementLoginInput): Promise<ManagementTokenResponse> {
    const accountId = await this.verifyAccount(input.username, input.password);
    const claims = await this.accountProviderService.getClaims(Number(accountId));

    if (!this.isSuperAdministrator(claims.super_administrator) || !this.isAdministrator(claims)) {
      throw new UnauthorizedException(MANAGEMENT_AUTH_FAILED_MESSAGE);
    }

    const expiresIn = this.configService.get<string | number>('MANAGEMENT_JWT_EXPIRES_IN', '1h');
    const issuedAt = Math.floor(Date.now() / 1000);
    const accessToken = await this.authorizationService.createToken(
      {
        sub: accountId,
        role: UserRole.Administrator,
        super_administrator: true,
        ram: {
          PolicyName: MANAGEMENT_POLICY_NAME,
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

  private async verifyAccount(username: string, password: string): Promise<string> {
    try {
      const accountId = await this.accountProviderService.verifyAccount(username, password);
      if (!accountId) {
        throw new UnauthorizedException(MANAGEMENT_AUTH_FAILED_MESSAGE);
      }
      return accountId;
    } catch {
      throw new UnauthorizedException(MANAGEMENT_AUTH_FAILED_MESSAGE);
    }
  }

  private isSuperAdministrator(value: unknown): boolean {
    return value === true || value === 1 || value === '1' || value === 'true';
  }

  private isAdministrator(claims: Record<string, unknown>): boolean {
    return claims.role === UserRole.Administrator || claims.capabilities === UserRole.Administrator;
  }
}
