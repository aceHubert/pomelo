import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { IsAvailableRouteForMultitenant } from '../decorators';
import { Params } from '../interfaces';
import { renderMsgPage } from '../templates';
import { OidcService } from '../oidc.service';

@IsAvailableRouteForMultitenant(true)
@Controller()
export class TenantSwitchController {
  constructor(public oidcService: OidcService) {}

  @Get('/tenant-switch-warn')
  getTenantSwitchWarn(@Req() req: Request, @Res() res: Response) {
    const query = req.query;

    const tenantSwitchPage = renderMsgPage({
      title: 'Are you sure ?',
      subtitle: `Do you want to continue on tenant ${query.requestedTenant}, you will be logged out of your current session.`,
      icon: 'warning' as const,
      redirect: {
        type: 'button',
        link: `/${query.originalTenant}/${query.originalChannel}/tenant-switch?tenantId=${query.requestedTenant}&channelType=${query.requestedChannel}`,
        label: 'Continue',
      },
      backLabel: 'Cancel',
    });
    res.send(tenantSwitchPage);
  }

  @Get('/:tenantId/:channelType/tenant-switch')
  getTenantSwitch(@Req() req: Request, @Res() res: Response, @Param() params: Params) {
    this.oidcService.logout(req, res, params);
  }
}
