import { Controller, Get, Next, Param, Req, Res, Header } from '@nestjs/common';
import { Request, Response } from 'express';
import { User, UserProfile } from '../helpers/user';
import { IsAvailableRouteForMultitenant, CurrentUser } from '../decorators';
import { Params } from '../interfaces';
import { OidcService } from '../oidc.service';

@IsAvailableRouteForMultitenant(true)
@Controller('/:tenantId/:channelType')
export class AuthMultitenantMultiChannelController {
  constructor(public oidcService: OidcService) {}

  @Get('/user')
  @Header('Cache-Control', 'no-store, max-age=0')
  user(@CurrentUser() user?: User): UserProfile | { isGuest: true } {
    return user?.profile ?? { isGuest: true };
  }

  @Get('/login')
  login(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: (error?: Error | any) => void,
    @Param() params: Params,
  ) {
    this.oidcService.login(req, res, next, params);
  }

  @Get('/logout')
  async logout(@Req() req: Request, @Res() res: Response, @Param() params: Params) {
    this.oidcService.logout(req, res, params);
  }

  @Get('/refresh-token')
  async refreshToken(@Req() req: Request, @Res() res: Response, @Param() params: Params) {
    this.oidcService.refreshToken(req, res, params);
  }

  @Get('/loggedout')
  loggedOut(@Req() req: Request, @Res() res: Response, @Param() params: Params) {
    this.oidcService.loggedOut(req, res, params);
  }
}
