export enum TriggerName {
  Message = 'message',
}

export interface ContentMessage {
  content: string;
  to?: string;
}

export interface EventMessage {
  eventName: string;
  payload?: string | number | boolean | Record<string, any>;
}
