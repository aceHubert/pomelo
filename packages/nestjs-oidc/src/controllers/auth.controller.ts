import { Controller, Get, Header, Next, Param, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { User, UserProfile } from '../helpers/user';
import { IsAvailableRouteForMultitenant, CurrentUser } from '../decorators';
import { Params } from '../interfaces';
import { OidcService } from '../oidc.service';

@IsAvailableRouteForMultitenant(false)
@Controller()
export class AuthController {
  constructor(public oidcService: OidcService) {}

  @Get('/user')
  @Header('Cache-Control', 'no-store, max-age=0')
  user(@CurrentUser() user?: User): UserProfile | { isGuest: true } {
    return user?.profile ?? { isGuest: true };
  }

  @Get('/login')
  @Header('Cache-Control', 'no-store, max-age=0')
  login(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: (error?: Error | any) => void,
    @Param() params: Params,
  ) {
    this.oidcService.login(req, res, next, params);
  }

  @Get('/logout')
  @Header('Cache-Control', 'no-store, max-age=0')
  async logout(@Req() req: Request, @Res() res: Response, @Param() params: Params) {
    this.oidcService.logout(req, res, params);
  }

  @Get('/refresh-token')
  @Header('Cache-Control', 'no-store, max-age=0')
  refreshToken(@Req() req: Request, @Res() res: Response, @Param() params: Params) {
    this.oidcService.refreshToken(req, res, params);
  }

  @Get('/loggedout')
  @Header('Cache-Control', 'no-store, max-age=0')
  loggedOut(@Req() req: Request, @Res() res: Response, @Param() params: Params) {
    this.oidcService.loggedOut(req, res, params);
  }
}
