import { loadPackage } from '@nestjs/common/utils/load-package.util';
import { SessionOptions } from 'express-session';
import { v4 as uuid } from 'uuid';
import { ChannelType } from '../interfaces/index';

const defaultOptions: SessionOptions = {
  secret: process.env.SESSION_SECRET || uuid(), // to sign session id
  resave: false, // will default to false in near future: https://github.com/expressjs/session#resave
  saveUninitialized: false, // will default to false in near future: https://github.com/expressjs/session#saveuninitialized
  rolling: true, // keep session alive
  cookie: {
    maxAge: 30 * 60 * 1000, // session expires in 1hr, refreshed by `rolling: true` option.
    httpOnly: true, // so that cookie can't be accessed via client-side script
    secure: false,
    //sameSite: 'lax',
  },
};

export function createExpressSession(options: Partial<SessionOptions>) {
  const session = loadPackage('express-session', 'MemoryStore', () =>
    require('express-session'),
  ) as typeof import('express-session');

  // if (process.env.NODE_ENV === 'production') {
  //   defaultOptions.cookie.secure = true; // https only
  // }

  return session({
    ...defaultOptions,
    ...options,
  });
}

declare module 'express-session' {
  interface SessionData {
    tenantId?: string;
    channelType?: ChannelType;
  }
}
