import { INestApplication } from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import session, { SessionOptions } from 'express-session';
import passport from 'passport';
import ConnectMongo from 'connect-mongo';
import { defaultOptions } from './base-session';

/**
 * setup session with mongo store
 */
export const sessionInMongo = (
  app: INestApplication,
  options: Partial<SessionOptions> & {
    connectMongoOptions: ConnectMongoOptions;
  },
) => {
  const MongoStore = loadPackage('connect-mongo', 'SessionModule', () =>
    require('connect-mongo'),
  ) as typeof ConnectMongo;

  const { connectMongoOptions, ...rest } = options;
  app.use(
    session({
      ...defaultOptions(),
      ...rest,
      store: MongoStore.create(connectMongoOptions),
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());
};

export interface ConnectMongoOptions {
  mongoUrl?: string;
  collectionName?: string;
  dbName?: string;
  ttl?: number;
  [key: string]: any;
}
