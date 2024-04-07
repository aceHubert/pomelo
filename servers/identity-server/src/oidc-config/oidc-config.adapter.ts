import { Adapter, AdapterPayload } from 'oidc-provider';
import { OidcStorage } from './interfaces/oidc.storage';

export class OidcConfigAdapter implements Adapter {
  constructor(public modelName: string, public storage: OidcStorage) {}

  async upsert(id: string, payload: AdapterPayload, expiresIn: number): Promise<void> {
    this.storage.upsert(this.modelName, id, payload, expiresIn);
  }

  async find(id: string): Promise<void | AdapterPayload> {
    return this.storage.find(this.modelName, id);
  }

  async findByUserCode(userCode: string): Promise<void | AdapterPayload> {
    return this.storage.findByUserCode(this.modelName, userCode);
  }

  async findByUid(uid: string): Promise<void | AdapterPayload> {
    return this.storage.findByUid(this.modelName, uid);
  }

  async consume(id: string): Promise<void> {
    this.storage.consume(this.modelName, id);
  }

  async destroy(id: string): Promise<void> {
    this.storage.destroy(this.modelName, id);
  }

  async revokeByGrantId(grantId: string): Promise<void> {
    this.storage.revokeByGrantId(grantId);
  }
}
