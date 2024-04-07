import { Logger } from '@nestjs/common';
import { AdapterPayload } from 'oidc-provider';

export abstract class OidcStorage {
  protected readonly logger: Logger;
  protected readonly grantable = new Set([
    'AccessToken',
    'AuthorizationCode',
    'RefreshToken',
    'DeviceCode',
    'BackchannelAuthenticationRequest',
  ]);

  constructor() {
    this.logger = new Logger(this.constructor.name, { timestamp: true });
  }

  protected key(model: string, id: string) {
    return `${model}:${id}`;
  }

  protected grantKeyFor(id: string) {
    return `grant:${id}`;
  }

  protected sessionUidKeyFor(id: string) {
    return `sessionUid:${id}`;
  }

  protected userCodeKeyFor(userCode: string) {
    return `userCode:${userCode}`;
  }

  abstract upsert(model: string, id: string, payload: AdapterPayload, expiresIn: number): Promise<void> | void;
  abstract consume(model: string, id: string): Promise<void | undefined> | void | undefined;
  abstract find(
    model: string,
    id: string,
  ): Promise<AdapterPayload | void | undefined> | AdapterPayload | void | undefined;
  abstract findByUid(
    model: string,
    uid: string,
  ): Promise<AdapterPayload | void | undefined> | AdapterPayload | void | undefined;
  abstract findByUserCode(
    model: string,
    userCode: string,
  ): Promise<AdapterPayload | void | undefined> | AdapterPayload | void | undefined;
  abstract revokeByGrantId(grantId: string): Promise<void | undefined> | void | undefined;
  abstract destroy(model: string, id: string): Promise<void | undefined> | void | undefined;
}
