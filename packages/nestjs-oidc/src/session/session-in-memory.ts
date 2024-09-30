import { INestApplication } from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import passport from 'passport';
import { baseSession } from './base-session';

export function sessionInMemory(app: INestApplication, name: string) {
  const session = loadPackage('express-session', 'MemoryStore', () => require('express-session'));
  app.use(
    session({
      name,
      ...baseSession,
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());
}
