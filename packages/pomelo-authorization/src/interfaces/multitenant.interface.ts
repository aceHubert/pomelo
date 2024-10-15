export enum ChannelType {
  b2c = 'b2c',
  b2e = 'b2e',
}

export interface Params {
  tenantId?: string;
  channelType?: ChannelType;
}
