import { AdapterPayload } from 'oidc-provider';
import { Injectable } from '@nestjs/common';
import { ClientDataSource } from '@ace-pomelo/identity-datasource';
import { RedisService } from '../storage/redis.service';
import { OidcAdapterServiceFactory } from '../oidc-config/oidc-adapter.factory';

@Injectable()
export class OidcRedisAdapterService extends OidcAdapterServiceFactory {
  constructor(private readonly redis: RedisService, protected readonly clientDataSource: ClientDataSource) {
    super();
  }

  async upsert(model: string, id: string, payload: AdapterPayload, expiresIn: number) {
    // stop registration endpoint to create client
    if (model === 'Client') {
      throw new Error('Client model not supported');
    }

    const key = this.key(model, id);
    const { grantId, userCode, uid } = payload;

    if (model === 'Session' && uid) {
      await this.redis.set(this.sessionUidKeyFor(uid), id, expiresIn);
    }

    if (this.grantable.has(model) && grantId) {
      const grantKey = this.grantKeyFor(grantId);
      const grant = await this.redis.get<string[]>(grantKey);

      if (!grant) {
        this.redis.set(grantKey, [key]);
      } else {
        grant.push(key);
      }
    }

    if (userCode) {
      await this.redis.set(this.userCodeKeyFor(userCode), id, expiresIn);
    }

    await this.redis.set(key, payload, expiresIn);
  }

  async destroy(model: string, id: string) {
    // stop registration endpoint to delete client
    if (model === 'Client') {
      throw new Error('Client model not supported');
    }

    const key = this.key(model, id);
    await this.redis.del(key);
  }

  async consume(model: string, id: string) {
    (await this.redis.get<any>(this.key(model, id))).consumed = true;
  }

  async find(model: string, id: string) {
    if (model === 'Client') {
      return this.getClient(id);
    }

    const payload = await this.redis.get<AdapterPayload>(this.key(model, id));
    // https://github.com/panva/node-oidc-provider/blob/main/lib/actions/userinfo.js#L108
    if (model === 'AccessToken' && payload) {
      if (payload) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { aud, ...rest } = payload;
        return rest;
      }
    }
    return payload as any;
  }

  async findByUid(model: string, uid: string) {
    const id = await this.redis.get<string>(this.sessionUidKeyFor(uid));
    return id ? this.find(model, id) : undefined;
  }

  async findByUserCode(model: string, userCode: string) {
    const id = await this.redis.get<string>(this.userCodeKeyFor(userCode));
    return id ? this.find(model, id) : undefined;
  }

  async revokeByGrantId(grantId: string) {
    const grantKey = this.grantKeyFor(grantId);
    const grant = await this.redis.get<any[]>(grantKey);
    if (grant) {
      await Promise.all(grant.map((token) => this.redis.del(token)));
      await this.redis.del(grantKey);
    }
  }
}
