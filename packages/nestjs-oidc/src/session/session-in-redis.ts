import { INestApplication } from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import session, { SessionOptions } from 'express-session';
import passport from 'passport';
import ConnectRedis from 'connect-redis';
import { defaultOptions } from './base-session';

/**
 * setup session with redis store
 */
export const sessionInRedis = (
  app: INestApplication,
  options: Partial<SessionOptions> & {
    connectRedisOptions: ConstructorParameters<typeof ConnectRedis>[0];
  },
) => {
  const RedisStore = loadPackage('connect-redis', 'SessionModule', () => require('connect-redis'))
    .default as typeof ConnectRedis;

  const { connectRedisOptions, ...rest } = options;
  app.use(
    session({
      ...defaultOptions(),
      ...rest,
      store: new RedisStore(connectRedisOptions),
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());
};
