import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as cookie from 'cookie';
import { LOGIN_SESSION_COOKIE, SESSION_STATE_COOKIE } from '../oidc.constants';

@Injectable()
export class LoginMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};

    const sessionCookieLabel = cookies[SESSION_STATE_COOKIE]
      ? SESSION_STATE_COOKIE
      : cookies[LOGIN_SESSION_COOKIE]
      ? LOGIN_SESSION_COOKIE
      : null;
    if (sessionCookieLabel) {
      req.options = { prompt: 'login' };
      res.clearCookie(sessionCookieLabel);
    } else {
      req.options = {};
    }
    next();
  }
}

declare module 'express' {
  export interface Request {
    options?: Record<string, any>;
  }
}
