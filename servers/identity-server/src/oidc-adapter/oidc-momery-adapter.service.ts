import LRU from 'lru-cache';
import { AdapterPayload } from 'oidc-provider';
import { Injectable } from '@nestjs/common';
import { OidcAdapterServiceFactory } from '../oidc-config/oidc-adapter.factory';

@Injectable()
export class OidcMomeryAdapterService extends OidcAdapterServiceFactory {
  private readonly storage: InstanceType<typeof LRU>;
  constructor() {
    super();

    this.storage = new LRU<string, unknown>({ max: 1000 });
  }

  upsert(model: string, id: string, payload: AdapterPayload, expiresIn: number) {
    const key = this.key(model, id);
    const { grantId, userCode, uid } = payload;

    if (model === 'Session' && uid) {
      this.storage.set(this.sessionUidKeyFor(uid), id, expiresIn * 1000);
    }

    if (this.grantable.has(model) && grantId) {
      const grantKey = this.grantKeyFor(grantId);
      const grant = this.storage.get(grantKey) as string[];

      if (!grant) {
        this.storage.set(grantKey, [key]);
      } else {
        grant.push(key);
      }
    }

    if (userCode) {
      this.storage.set(this.userCodeKeyFor(userCode), id, expiresIn * 1000);
    }

    this.storage.set(key, payload, expiresIn * 1000);
  }

  destroy(model: string, id: string) {
    const key = this.key(model, id);
    this.storage.del(key);
  }

  consume(model: string, id: string) {
    (this.storage.get(this.key(model, id)) as any).consumed = true;
  }

  find(model: string, id: string) {
    const payload = this.storage.get(this.key(model, id)) as AdapterPayload | undefined;
    // https://github.com/panva/node-oidc-provider/blob/main/lib/actions/userinfo.js#L108
    if (model === 'AccessToken' && payload) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { aud, ...rest } = payload;
      return rest;
    }
    return payload;
  }

  findByUid(model: string, uid: string) {
    const id = this.storage.get(this.sessionUidKeyFor(uid)) as string;
    return this.find(model, id);
  }

  findByUserCode(model: string, userCode: string) {
    const id = this.storage.get(this.userCodeKeyFor(userCode)) as string;
    return this.find(model, id);
  }

  revokeByGrantId(grantId: string) {
    const grantKey = this.grantKeyFor(grantId);
    const grant = this.storage.get(grantKey) as any[];
    if (grant) {
      grant.forEach((token) => this.storage.del(token));
      this.storage.del(grantKey);
    }
  }
}
