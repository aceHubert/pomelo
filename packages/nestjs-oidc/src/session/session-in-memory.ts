import { INestApplication } from '@nestjs/common';
import passport from 'passport';
import { createExpressSession } from './express-session';

export function sessionInMemory(
  app: INestApplication,
  name: string,
  options?: {
    sessionStrategy?: (options: { name: string; [key: string]: any }) => any;
    // rest of sessionStrategy options
    [key: string]: any;
  },
) {
  const { sessionStrategy, ...rest } = options ?? {};
  app.use((sessionStrategy ?? createExpressSession)({ ...rest, name }));
  app.use(passport.initialize());
  app.use(passport.session());
}
