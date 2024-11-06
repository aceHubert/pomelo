import { Inject, ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { OidcModuleOptions, ChannelType, Params } from '../interfaces/index';
import { filter } from '../utils/conditional-exception-filter';
import { UnauthorizedError } from '../utils/errors';
import { OIDC_MODULE_OPTIONS, LOGIN_SESSION_COOKIE } from '../oidc.constants';

@Catch(filter({ for: UnauthorizedError, when: (exception: UnauthorizedError) => exception.redirect }))
export class UnauthorizedFilter implements ExceptionFilter {
  constructor(
    @Inject(OIDC_MODULE_OPTIONS) private readonly options: OidcModuleOptions,
    private readonly httpAdapterHost: HttpAdapterHost,
  ) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost,
      ctx = host.switchToHttp(),
      request = ctx.getRequest(),
      response = ctx.getResponse();

    if (this.options.promptLogin) {
      // Add the LOGIN_SESSION_COOKIE to make sure to prompt the login page if the user has already authenticated before
      response.cookie(LOGIN_SESSION_COOKIE, 'logging in', {
        maxAge: 15 * 1000 * 60,
      });
    }

    // If you want to send the query params to the login middleware
    const searchParams = new URLSearchParams(request.query as any).toString();

    const prefix = this.getPrefixFromRequest(request);

    // If you're using the multitenancy authentication, you'll need to get the prefix
    return httpAdapter.redirect(
      response,
      HttpStatus.FOUND,
      `${prefix}/login?redirect=${httpAdapter.getRequestUrl(request)}${searchParams ? `&${searchParams}` : ''}`,
    );
  }

  private getPrefixFromRequest(request: any) {
    const { tenantId, channelType } = this.getMultitenantParamsFromRequest(request);

    const prefix = [tenantId, channelType].filter(Boolean).join('/');
    return prefix ? `/${prefix}` : '';
  }

  private getMultitenantParamsFromRequest(request: any): Params {
    const routeParams = request.params && request.params[0] && request.params[0].split('/');
    const fixedChannelType = this.options.channelType;
    let tenantId, channelType;
    if (routeParams && routeParams[1] && (routeParams[1] === ChannelType.b2c || routeParams[1] === ChannelType.b2e)) {
      tenantId = routeParams[0];
      channelType = routeParams[1];
    } else if (routeParams && (fixedChannelType === ChannelType.b2c || fixedChannelType === ChannelType.b2e)) {
      tenantId = routeParams[0];
      channelType = fixedChannelType;
    }
    return { tenantId, channelType };
  }
}
