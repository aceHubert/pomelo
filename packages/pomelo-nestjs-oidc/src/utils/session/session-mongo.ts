import { INestApplication } from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import session from 'express-session';
import passport from 'passport';
import { baseSession } from './base-session';

export const sessionMongo = (app: INestApplication, name: string, options: ConnectMongoOptions) => {
  const MongoStore = loadPackage('connect-mongo', 'SessionModule', () => require('connect-mongo'));
  app.use(
    session({
      name,
      ...baseSession,
      store: MongoStore.create(options),
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
