import { INestApplication } from '@nestjs/common';
import session, { SessionOptions } from 'express-session';
import createMemoryStore from 'memorystore';
import passport from 'passport';
import { defaultOptions } from './base-session';

const MomeryStore = createMemoryStore(session);

/**
 * setup session with in-memory store
 */
export function sessionInMemory(
  app: INestApplication,
  options?: Partial<SessionOptions> & {
    memoryOptions?: ConstructorParameters<ReturnType<typeof createMemoryStore>>[0];
  },
) {
  const { memoryOptions, ...rest } = options ?? {};
  app.use(
    session({
      ...defaultOptions(),
      ...rest,
      store: new MomeryStore({
        checkPeriod: 86400000, // prune expired entries every 24h
        ...memoryOptions,
      }),
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());
}
