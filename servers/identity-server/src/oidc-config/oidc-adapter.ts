import { Adapter, AdapterPayload } from 'oidc-provider';
import { OidcAdapterServiceFactory } from './oidc-adapter.factory';

export class OidcConfigAdapter implements Adapter {
  constructor(public modelName: string, public serviceFactory: OidcAdapterServiceFactory) {}

  async upsert(id: string, payload: AdapterPayload, expiresIn: number): Promise<void> {
    this.serviceFactory.upsert(this.modelName, id, payload, expiresIn);
  }

  async find(id: string): Promise<void | AdapterPayload> {
    return this.serviceFactory.find(this.modelName, id);
  }

  async findByUserCode(userCode: string): Promise<void | AdapterPayload> {
    return this.serviceFactory.findByUserCode(this.modelName, userCode);
  }

  async findByUid(uid: string): Promise<void | AdapterPayload> {
    return this.serviceFactory.findByUid(this.modelName, uid);
  }

  async consume(id: string): Promise<void> {
    this.serviceFactory.consume(this.modelName, id);
  }

  async destroy(id: string): Promise<void> {
    this.serviceFactory.destroy(this.modelName, id);
  }

  async revokeByGrantId(grantId: string): Promise<void> {
    this.serviceFactory.revokeByGrantId(grantId);
  }
}
