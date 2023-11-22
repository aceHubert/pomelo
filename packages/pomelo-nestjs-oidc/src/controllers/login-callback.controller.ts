import { Controller, Get, Next, Param, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { Params } from '../interfaces';
import { Public } from '../decorators/public.decorator';
import { OidcService } from '../oidc.service';

@Controller('/login/callback')
export class LoginCallbackController {
  constructor(public oidcService: OidcService) {}

  @Public()
  @Get()
  loginCallback(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: (error?: Error | any) => void,
    @Param() params: Params,
  ) {
    this.oidcService.login(req, res, next, params);
  }
}
