import { Response } from 'express';
import { Provider } from 'oidc-provider';
import { Controller, Get, Res } from '@nestjs/common';

/**
 * External Discovery Controller
 */
@Controller('/connect')
export class DiscoveryController {
  constructor(private readonly provider: Provider) {}

  @Get('/checksession')
  checkSession(@Res() res: Response) {
    // @ts-expect-error type missing
    const sessionName = this.provider.cookieName('session');
    return res.render('checksession', {
      layout: false,
      sessionName: `${sessionName}`,
    });
  }
}
