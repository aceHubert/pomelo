import { INestApplication } from '@nestjs/common';
import { sessionInMemory } from './session/session-in-memory';

export const setupSession = (app: INestApplication, name: string) => {
  return sessionInMemory(app, name);
};
