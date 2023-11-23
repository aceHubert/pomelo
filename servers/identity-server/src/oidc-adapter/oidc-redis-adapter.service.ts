import jwt from 'jsonwebtoken';
import { createClient, RedisClientType } from 'redis';
import { AdapterPayload } from 'oidc-provider';
import { Injectable, Logger, OnModuleInit, OnApplicationShutdown } from '@nestjs/common';
import { jsonSafelyParse } from '@ace-pomelo/shared-server';
import { OidcAdapterServiceFactory } from '../oidc-config/oidc-adapter.factory';

@Injectable()
export class OidcRedisAdapterService extends OidcAdapterServiceFactory implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(OidcRedisAdapterService.name, { timestamp: true });
  private readonly storage: RedisClientType;

  constructor() {
    super();
    this.storage = createClient({
      url: 'redis://localhost:6379/0',
    });
  }

  async onModuleInit() {
    this.storage.on('connect', () => {
      this.logger.debug('Redis connected');
    });
    this.storage.on('disconnect', () => {
      this.logger.debug('Redis disconnect');
    });
    this.storage.on('error', (err) => {
      this.logger.error(err);
    });
    await this.storage.connect();
  }

  async onApplicationShutdown() {
    await this.storage.disconnect();
  }

  async upsert(model: string, id: string, payload: AdapterPayload, expiresIn: number) {
    const key = this.key(model, id);
    const { grantId, userCode, uid } = payload;

    if (model === 'Session' && uid) {
      await this.storage.set(this.sessionUidKeyFor(uid), this.encode(id), {
        EX: expiresIn * 1000,
      });
    }

    if (this.grantable.has(model) && grantId) {
      const grantKey = this.grantKeyFor(grantId);
      const grant = this.decode<string[]>(await this.storage.get(grantKey));

      if (!grant) {
        this.storage.set(grantKey, this.encode([key]));
      } else {
        grant.push(key);
      }
    }

    if (userCode) {
      await this.storage.set(this.userCodeKeyFor(userCode), this.encode(id), {
        EX: expiresIn * 1000,
      });
    }

    await this.storage.set(key, this.encode(payload), {
      EX: expiresIn * 1000,
    });
  }

  async destroy(model: string, id: string) {
    const key = this.key(model, id);
    await this.storage.del(key);
  }

  async consume(model: string, id: string) {
    this.decode(await this.storage.get(this.key(model, id))).consumed = true;
  }

  async find(model: string, id: string) {
    let payload = this.decode<AdapterPayload>(await this.storage.get(this.key(model, id)));
    // https://github.com/panva/node-oidc-provider/blob/main/lib/actions/userinfo.js#L108
    if (model === 'AccessToken') {
      // try jwt decode
      if (!payload) {
        payload = jwt.decode(id, { json: true }) as AdapterPayload;
      }
      if (payload) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { aud, ...rest } = payload;
        return rest;
      }
    }
    return payload as any;
  }

  async findByUid(model: string, uid: string) {
    const id = this.decode<string>(await this.storage.get(this.sessionUidKeyFor(uid)));
    return id ? this.find(model, id) : undefined;
  }

  async findByUserCode(model: string, userCode: string) {
    const id = this.decode<string>(await this.storage.get(this.userCodeKeyFor(userCode)));
    return id ? this.find(model, id) : undefined;
  }

  async revokeByGrantId(grantId: string) {
    const grantKey = this.grantKeyFor(grantId);
    const grant = this.decode<any[]>(await this.storage.get(grantKey));
    if (grant) {
      await Promise.all(grant.map((token) => this.storage.del(token)));
      await this.storage.del(grantKey);
    }
  }

  private encode(payload: any) {
    if (payload === undefined) return payload;

    return JSON.stringify(payload);
  }

  private decode<T = any>(payload: string | null | undefined): T | null | undefined {
    if (payload === null || payload === undefined) return payload;

    return jsonSafelyParse<T>(payload);
  }
}
