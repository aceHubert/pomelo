export interface ContentMessage {
  content: string;
  to?: string;
}

export interface EventMessage {
  eventName: string;
  payload?: string | number | boolean | Record<string, any>;
}

export interface Message {
  includes?: Array<string | number> | ((currentUser: string | number) => boolean | Promise<boolean>);
  excludes?: Array<string | number> | ((currentUser: string | number) => boolean | Promise<boolean>);
  message: ContentMessage | EventMessage;
}
