import { Controller, Get, Next, Param, Req, Res, Header } from '@nestjs/common';
import { Request, Response } from 'express';
import { IsAvailableRouteForMultitenant, Public, CurrentUser } from '../decorators';
import { Params, User } from '../interfaces';
import { OidcService } from '../oidc.service';

@IsAvailableRouteForMultitenant(true)
@Controller('/:tenantId/:channelType')
export class AuthMultitenantMultiChannelController {
  constructor(public oidcService: OidcService) {}

  @Get('/user')
  @Header('Cache-Control', 'no-store, max-age=0')
  user(@CurrentUser() user?: User): User['profile'] | { isGuest: true } {
    return user?.profile ?? { isGuest: true };
  }

  @Public()
  @Get('/login')
  login(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: (error?: Error | any) => void,
    @Param() params: Params,
  ) {
    this.oidcService.login(req, res, next, params);
  }

  @Public()
  @Get('/logout')
  async logout(@Req() req: Request, @Res() res: Response, @Param() params: Params) {
    this.oidcService.logout(req, res, params);
  }

  @Get('/refresh-token')
  async refreshToken(@Req() req: Request, @Res() res: Response, @Param() params: Params) {
    this.oidcService.refreshToken(req, res, params);
  }

  @Public()
  @Get('/loggedout')
  loggedOut(@Req() req: Request, @Res() res: Response, @Param() params: Params) {
    this.oidcService.loggedOut(req, res, params);
  }
}
