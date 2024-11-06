import { INestApplication } from '@nestjs/common';
import { SessionOptions } from 'express-session';
import { sessionInMemory } from './session/session-in-memory';
import { sessionInMongo } from './session/session-in-mongo';
import { sessionInRedis } from './session/session-in-redis';

/**
 * setup session
 */
export function setupSession(
  app: INestApplication,
  type: 'memory' | 'mongo' | 'redis' = 'memory',
  options?: Partial<SessionOptions> & {
    [key: string]: any;
  },
) {
  switch (type) {
    case 'memory':
      return sessionInMemory(app, options);
    case 'mongo':
      if (!options?.connectMongoOptions) throw new Error('connectMongoOptions is required for session type mongo');
      return sessionInMongo(app, options as any);
    case 'redis':
      if (!options?.connectRedisOptions) throw new Error('connectRedisOptions is required for session type redis');
      return sessionInRedis(app, options as any);
    default:
      throw new Error(`session type ${type} is not supported`);
  }
}
