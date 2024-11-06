import session, { SessionOptions } from 'express-session';
import { v4 as uuid } from 'uuid';
import { ChannelType } from '../interfaces/index';

// https://github.com/expressjs/session/issues/725#issuecomment-605922223
Object.defineProperty(session.Cookie.prototype, 'sameSite', {
  // sameSite cannot be set to `None` if cookie is not marked secure
  get() {
    return this._sameSite === 'none' && !this.secure ? 'lax' : this._sameSite;
  },
  set(value) {
    this._sameSite = value;
  },
});

export const defaultOptions = function (): SessionOptions {
  return {
    secret: process.env.SESSION_SECRET || uuid(), // to sign session id
    resave: false, // will default to false in near future: https://github.com/expressjs/session#resave
    saveUninitialized: false, // will default to false in near future: https://github.com/expressjs/session#saveuninitialized
    rolling: true, // keep session alive
    proxy: true, // trust first proxy
    cookie: {
      maxAge: 60 * 60 * 1000, // session expires in 1hr, refreshed by `rolling: true` option.
      httpOnly: true, // so that cookie can't be accessed via client-side script
      secure: 'auto', // set to true if your communication is over HTTPS
      sameSite: 'none', // set to 'none' if your communication is over HTTPS
    },
  };
};

declare module 'express-session' {
  interface SessionData {
    tenantId?: string;
    channelType?: ChannelType;
  }
}
