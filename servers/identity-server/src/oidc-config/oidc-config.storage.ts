import { AdapterPayload, ClientMetadata } from 'oidc-provider';
import { Storage } from './interfaces/oidc-config-options.interface';
import { OidcStorage } from './interfaces/oidc.storage';

export class OidcConfigStorage extends OidcStorage {
  constructor(
    private storage: Storage,
    private getRemoteClient: (clientId: string) => Promise<ClientMetadata | undefined>,
  ) {
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
      await this.storage.set(this.sessionUidKeyFor(uid), id, expiresIn);
    }

    if (this.grantable.has(model) && grantId) {
      const grantKey = this.grantKeyFor(grantId);
      const grant = await this.storage.get<string[]>(grantKey);

      if (!grant) {
        this.storage.set(grantKey, [key]);
      } else {
        grant.push(key);
      }
    }

    if (userCode) {
      await this.storage.set(this.userCodeKeyFor(userCode), id, expiresIn);
    }

    await this.storage.set(key, payload, expiresIn);
  }

  async destroy(model: string, id: string) {
    // stop registration endpoint to delete client
    if (model === 'Client') {
      throw new Error('Client model not supported');
    }

    const key = this.key(model, id);
    await this.storage.del(key);
  }

  async consume(model: string, id: string) {
    (await this.storage.get<any>(this.key(model, id))).consumed = true;
  }

  async find(model: string, id: string) {
    if (model === 'Client') {
      return this.getRemoteClient(id);
    }

    const payload = await this.storage.get<AdapterPayload>(this.key(model, id));
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
    const id = await this.storage.get<string>(this.sessionUidKeyFor(uid));
    return id ? this.find(model, id) : undefined;
  }

  async findByUserCode(model: string, userCode: string) {
    const id = await this.storage.get<string>(this.userCodeKeyFor(userCode));
    return id ? this.find(model, id) : undefined;
  }

  async revokeByGrantId(grantId: string) {
    const grantKey = this.grantKeyFor(grantId);
    const grant = await this.storage.get<any[]>(grantKey);
    if (grant) {
      await Promise.all(grant.map((token) => this.storage.del(token)));
      await this.storage.del(grantKey);
    }
  }
}
