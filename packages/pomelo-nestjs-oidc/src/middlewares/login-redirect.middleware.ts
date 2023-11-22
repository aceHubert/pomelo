import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LOGIN_SESSION_COOKIE } from '../oidc.constants';
import { OidcService } from '../oidc.service';

@Injectable()
export class LoginRedirectMiddleware implements NestMiddleware {
  constructor(private oidcService: OidcService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // If the request is authenticated, do nothing
    if (req.isAuthenticated()) {
      return next();
    }

    // Add the LOGIN_SESSION_COOKIE to make sure to prompt the login page if the user has already authenticated before
    res.cookie(LOGIN_SESSION_COOKIE, 'logging in', {
      maxAge: 15 * 1000 * 60,
    });

    // If you want to send the query params to the login middleware
    const searchParams = new URLSearchParams(req.query as any).toString();

    const prefix = this.oidcService.getPrefixFromRequest(req);

    // If you're using the multitenancy authentication, you'll need to get the prefix
    res.redirect(`${prefix}/login?redirect_url=${req.url}${searchParams ? `&${searchParams}` : ''}`);
  }
}
