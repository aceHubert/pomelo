import { INestApplication } from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import passport from 'passport';
import ConnectMongo from 'connect-mongo';
import { createExpressSession } from './express-session';

export const sessionMongo = (
  app: INestApplication,
  name: string,
  options: {
    connectMongoOptions: ConnectMongoOptions;
    sessionStrategy?: (options: { name: string; store: ConnectMongo; [key: string]: any }) => any;
    // rest of sessionStrategy options
    [key: string]: any;
  },
) => {
  const MongoStore = loadPackage('connect-mongo', 'SessionModule', () =>
    require('connect-mongo'),
  ) as typeof ConnectMongo;

  const { sessionStrategy, connectMongoOptions, ...rest } = options;
  app.use(
    (sessionStrategy ?? createExpressSession)({
      ...rest,
      name,
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
